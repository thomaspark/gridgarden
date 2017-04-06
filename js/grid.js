/*
Query <div id="overlay"> element and assign variable.
use for loop to append <span class="plot"></span> elements
for code efficiency.
*/
var $;
var overlayElem = $('#overlay');
var soilElem = $('#soil');
var lineNumbersElem = $('.line-numbers');

var createGrid = function() {
    "use strict";

    for (var i = 0; i < 35; i++) {
        overlayElem.append('<span class="plot"></span>');
        soilElem.append('<span class="plot"></span>');
    }
    for (var i = 1; i < 14; i++) {
        lineNumbersElem.append(i + '<br>');
    }
    lineNumbersElem.append(14);
};


var move = function() {
    "use strict";

    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, 10);

    function frame() {
        if (width >= 100) {
            clearInterval(id);
        } else {
            width++;
            elem.style.width = width + '%';
        }
    }
};