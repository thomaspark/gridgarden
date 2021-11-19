var game = {
  language: window.location.hash.substring(1) || 'en',
  level: parseInt(localStorage.level, 10) || 0,
  answers: (localStorage.answers && JSON.parse(localStorage.answers)) || {},
  solved: (localStorage.solved && JSON.parse(localStorage.solved)) || [],
  user: localStorage.user || '',
  changed: false,

  start: function() {
    // navigator.language can include '-'
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language
    var requestLang = window.navigator.language.split('-')[0];
    if (window.location.hash === '' && requestLang !== 'en' && messages.languageActive.hasOwnProperty(requestLang)) {
      game.language = requestLang;
      window.location.hash = requestLang;
    }
    game.translate();

    $('#level-counter .total').text(levels.length);
    $('#editor').show();
    $('#share').hide();

    if (!localStorage.user) {
      game.user = '' + (new Date()).getTime() + Math.random().toString(36).slice(1);
      localStorage.setItem('user', game.user);
    }

    this.setHandlers();
    this.loadMenu();
    game.loadLevel(levels[game.level]);
  },

  setHandlers: function() {
    $('#next').on('click', function() {
      $('#code').focus();

      if ($(this).hasClass('disabled')) {
        if (!$('.treatment').hasClass('animated')) {
          game.tryagain();
        }

        return;
      }

      $(this).removeClass('animated animation');

      $('.treatment').fadeOut(1000, 'linear', function() {
        $('.carrot, .weed').addClass('correct');
      });
      $('.arrow, #next').addClass('disabled');

      setTimeout(function() {
        if (game.level >= levels.length - 1) {
          game.win();
        } else {
          game.next();
        }
      }, 2500);
    });

    $('#code').on('keydown', function(e) {
      if (e.keyCode === 13) {

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          game.check();
          $('#next').click();
          return;
        }

        var max = $(this).data('lines');
        var code = $(this).val();
        var trim = code.trim();
        var codeLength = code.split('\n').length;
        var trimLength = trim.split('\n').length;

        if (codeLength >= max) {

          if (codeLength === trimLength) {
            e.preventDefault();
            $('#next').click();
          } else {
            $('#code').focus().val('').val(trim);
          }
        }
      }
    }).on('input', game.debounce(game.check, 200))
    .on('input', function() {
      game.changed = true;
      $('#next').removeClass('animated animation').addClass('disabled');
    });

    $('#editor').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).removeClass();
    });

    $('#labelReset').on('click', function() {
      var warningReset = messages.warningReset[game.language] || messages.warningReset.en;
      var r = confirm(warningReset);

      if (r) {
        game.level = 0;
        game.answers = {};
        game.solved = [];
        game.loadLevel(levels[0]);

        $('.level-marker').removeClass('solved');
      }
    });

    $('#language .toggle').on('click', function() {
      $('#levelsWrapper').hide();
      $('#language .tooltip').toggle();
    });

    $('#language a').on('click', function() {
      $('.tooltip').hide();
      var language = $(this).text();
      $('#language .toggle').text(language);
    });

    $('body').on('click', function() {
      $('.tooltip').hide();
    });

    $('.tooltip, .toggle, #level-indicator').on('click', function(e) {
      e.stopPropagation();
    });

    $(window).on('beforeunload', function() {
      game.saveAnswer();
      localStorage.setItem('level', game.level);
      localStorage.setItem('answers', JSON.stringify(game.answers));
      localStorage.setItem('solved', JSON.stringify(game.solved));
    }).on('hashchange', function() {
      game.language = window.location.hash.substring(1) || 'en';
      game.translate();

      $('#tweet iframe').remove();
      var html = '<a href="https://twitter.com/share" class="twitter-share-button"{count} data-url="https://cssgridgarden.com" data-via="thomashpark" data-text="I just beat Grid Garden, a game for learning CSS grid layout!">Tweet</a> ' +
                 '<a href="https://twitter.com/thomashpark" class="twitter-follow-button" data-show-count="false">Follow @thomashpark</a>';
      $('#tweet').html(html);

      if (typeof twttr !== 'undefined') {
        twttr.widgets.load();
      }

      if (game.language === 'en') {
        history.replaceState({}, document.title, './');
      }
    });
  },

  prev: function() {
    this.level--;

    var levelData = levels[this.level];
    this.loadLevel(levelData);
  },

  next: function() {
    this.level++;

    var levelData = levels[this.level];
    this.loadLevel(levelData);
  },

  loadMenu: function() {
    levels.forEach(function(level, i) {
      var levelMarker = $('<span/>').addClass('level-marker').attr({'data-level': i, 'title': level.name}).text(i+1);

      if ($.inArray(level.name, game.solved) !== -1) {
        levelMarker.addClass('solved');
      }

      levelMarker.appendTo('#levels');
    });

    $('.level-marker').on('click', function() {
      game.saveAnswer();

      var level = $(this).attr('data-level');
      game.level = parseInt(level, 10);
      game.loadLevel(levels[level]);
    });

    $('#level-indicator').on('click', function() {
      $('#language .tooltip').hide();
      $('#levelsWrapper').toggle();
    });

    $('.arrow.left').on('click', function() {
      if ($(this).hasClass('disabled')) {
        return;
      }

      game.saveAnswer();
      game.prev();
    });

    $('.arrow.right').on('click', function() {
      if ($(this).hasClass('disabled')) {
        return;
      }

      game.saveAnswer();
      game.next();
    });
  },

  loadLevel: function(level) {
    $('#editor').show();
    $('#share').hide();
    $('#plants, #garden').removeClass().attr('style', '').empty();
    $('#soil, #overlay').removeClass().attr('style', '');
    $('#levelsWrapper').hide();
    $('.level-marker').removeClass('current').eq(this.level).addClass('current');
    $('#level-counter .current').text(this.level + 1);
    $('#before').text(level.before);
    $('#after').text(level.after);
    $('#next').removeClass('animated animation').addClass('disabled');

    var instructions = level.instructions[game.language] || level.instructions.en;
    $('#instructions').html(instructions);

    $('.arrow.disabled').removeClass('disabled');

    if (this.level === 0) {
      $('.arrow.left').addClass('disabled');
    }

    if (this.level === levels.length - 1) {
      $('.arrow.right').addClass('disabled');
    }

    var answer = game.answers[level.name];
    $('#code').val(answer).focus();

    this.loadDocs();

    var lines = Object.keys(level.style).length;
    $('#code').height(20 * lines).data("lines", lines);

    var string = level.board;
    var markup = '';
    var colors = {
      'c': 'carrot',
      'w': 'weed'
    };

    for (var i = 0; i < string.length; i++) {
      var c = string.charAt(i);
      var color = colors[c];

      var plant = $('<div/>').addClass('plant ' + color).data('color', color);
      var treatment = $('<div/>').addClass('treatment ' + color).data('color', color);

      $('<div/>').addClass('bg').appendTo(plant);
      $('<div/>').addClass('bg').appendTo(treatment);

      $('#plants').append(plant);
      $('#garden').append(treatment);
    }

    var classes = level.classes;

    if (classes) {
      for (var rule in classes) {
        $(rule).addClass(classes[rule]);
      }
    }

    var selector = level.selector || '';
    $('#plants ' + selector).css(level.style);

    game.changed = false;
    game.applyStyles();
    game.check();
  },

  loadDocs: function() {
    $('#instructions code').each(function() {
      var code = $(this);
      var text = code.text();

      if (text in docs) {
        code.addClass('help');
        code.on('mouseenter', function(e) {
          if ($('#instructions .tooltip').length === 0) {
            var html = docs[text][game.language] || docs[text].en;
            var tooltipX = code.offset().left;
            var tooltipY = code.offset().top + code.height() + 13;
            $('<div class="tooltip"></div>').html(html).css({top: tooltipY, left: tooltipX}).appendTo($('#instructions'));
          }
        }).on('mouseleave', function() {
          $('#instructions .tooltip').remove();
        });
      }
    });
  },

  applyStyles: function() {
    var level = levels[game.level];
    var code = $('#code').val();
    var selector = level.selector || '';
    $('#garden ' +  selector).attr('style', code);

    if (!selector) {
      if (code) {
        $('#soil, #overlay').attr('style', code);
      } else {
        $('#soil, #overlay').attr('style', '');
      }
    }

    game.saveAnswer();
  },
  
  check: function() {    
    game.applyStyles();

    var level = levels[game.level];
    var plants = {};
    var treatments = {};
    var correct = true;

    $('.treatment').each(function() {
      var position = {};

      position.top = Math.round(this.getBoundingClientRect().top);
      position.left = Math.round(this.getBoundingClientRect().left);
      position.width = Math.floor(parseFloat(window.getComputedStyle(this).width));
      position.height = Math.floor(parseFloat(window.getComputedStyle(this).height));

      var key = JSON.stringify(position);
      var val = $(this).data('color');
      treatments[key] = val;
    });

    $('.plant').each(function() {
      var position = {};

      position.top = Math.round(this.getBoundingClientRect().top);
      position.left = Math.round(this.getBoundingClientRect().left);
      position.width = Math.floor(parseFloat(window.getComputedStyle(this).width));
      position.height = Math.floor(parseFloat(window.getComputedStyle(this).height));

      var key = JSON.stringify(position);
      var val = $(this).data('color');

      if (!(key in treatments) || treatments[key] !== val) {
        correct = false;
      }
    });

    if (correct) {
      ga('send', {
        hitType: 'event',
        eventCategory: level.name,
        eventAction: 'correct',
        eventLabel: $('#code').val()
      });
            
      if ($.inArray(level.name, game.solved) === -1) {
        game.solved.push(level.name);
      }

      $('[data-level=' + game.level + ']').addClass('solved');
      $('#next').removeClass('disabled').addClass('animated animation');
    } else {
      ga('send', {
        hitType: 'event',
        eventCategory: level.name,
        eventAction: 'incorrect',
        eventLabel: $('#code').val()
      });
    }
  },

  saveAnswer: function() {
    var level = levels[this.level];
    game.answers[level.name] = $('#code').val();
  },

  tryagain: function() {
    $('#editor').addClass('animated shake');
  },

  win: function() {
    var solution = $('#code').val();

    this.loadLevel(levelWin);

    $('#editor').hide();
    $('#code').val(solution);
    $('#share').show();
  },

  transform: function() {
    var scale = 1 + ((Math.random() / 5) - 0.2);
    var rotate = 360 * Math.random();
    scale = 1;
    rotate = 0;

    return {'transform': 'scale(' + scale + ') rotate(' + rotate + 'deg)'};
  },

  translate: function() {
    document.title = messages.title[game.language] || messages.title.en;
    $('html').attr('lang', game.language);

    var level = $('#editor').is(':visible') ? levels[game.level] : levelWin;
    var instructions = level.instructions[game.language] || level.instructions.en;
    $('#instructions').html(instructions);
    game.loadDocs();

    $('.translate').each(function() {
      var label = $(this).attr('id');
      var text = messages[label][game.language] || messages[label].en;

      $('#' + label).text(text);
    });
  },

  debounce: function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
};

$(document).ready(function() {
  game.start();

  var d = document.documentElement.style;

  if (!('gridArea' in d)) {
    var warning = messages.warningUnsupported[game.language] || messages.warningUnsupported.en;
    $('#editor, #level-counter, #instructions').hide();
    $('<div>' + warning + '</div>').insertAfter($('#editor'));
  }
});
