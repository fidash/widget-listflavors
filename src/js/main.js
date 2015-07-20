/* global ListFlavors */

$(document).ready(function() {
    "use strict";

	var listFlavors = new ListFlavors();

    listFlavors.init();
    listFlavors.authenticate();
});