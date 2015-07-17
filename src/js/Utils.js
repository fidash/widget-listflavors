var Utils = (function () {
    "use strict";


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function getDisplayableSize (size) {
        
        var unitChangeLimit = 1024;
        var units = [
            "B",
            "kiB",
            "MiB",
            "GiB",
            "TiB",
            "PiB",
            "EiB",
            "ZiB",
            "YiB",
        ];
        size = parseFloat(size);
        var displayableSize = size;
        var unit = 0;

        if (size < unitChangeLimit) {
            return size + ' ' + units[0];
        }

        while (parseFloat(displayableSize/unitChangeLimit) >= parseFloat(1) && unit < 9) {
            displayableSize /= unitChangeLimit;
            unit += 1;
        }

        return displayableSize.toFixed(2) + ' ' + units[unit];
    
    }

    function createAlert (type, title, message, region, details) {

        // TODO buffer previous alerts and shown them on a list
 
        var alert = $('<div>')
            .addClass('alert alert-dismissible alert-' + type + ' fade in')
            .attr('role', 'alert')
            .html('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>');

        if (region) {
            // Region
            $('<strong>')
                .text(region + ' ')
                .appendTo(alert);
        }

        // Title
        $('<strong>')
            .text(title + ' ')
            .appendTo(alert);

        // Message
        $('<span>')
            .text(message  + ' ')
            .appendTo(alert);

        if (details) {
            // Details
            var detailsMessage = $('<div>')
                .appendTo(alert)
                .hide();
            for (var detail in details) {
                detailsMessage.text(detailsMessage.text() + details[detail] + ' ');
            }

            // Toggle details
            $('<a>')
                .text('Details')
                .click(function () {
                    detailsMessage.toggle('fast');
                })
                .insertBefore(detailsMessage);
        }

        $('body').append(alert);

    }

    return {
        getDisplayableSize: getDisplayableSize,
        createAlert: createAlert
    };
})();