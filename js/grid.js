

/*
Query <div id="overlay"> element and assign variable.
use for loop to append <span class="plot"></span> elements
for code efficiency.
*/

var overlayElem = $('#overlay');
var soilElem = $('#soil');
var createGrid = function () {

	for (var i = 0;i < 35;i++) {
	overlayElem.append('<span class="plot"></span>');
	soilElem.append('<span class="plot"></span>');
	};

};
createGrid();