/* global ListImages */

$(document).ready(function() {
    "use strict";

	var listImages = new ListImages();

    listImages.init();
    listImages.authenticate();
});