/* global Utils,Region */

var UI = (function () {
    "use strict";

    var hiddenColumns = [];
    var dataTable;

    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function initDataTable () {

        var columns = [
            {'title': 'ID'},
            {'title': 'Name'},
            {'title': 'RAM'},
            {'title': 'VCPUs'},
            {'title': 'Disk'},
            {'title': 'Swap'},
            {'title': 'Region'}
            // {'title': 'Actions'}
        ];

        dataTable = $('#flavors_table').dataTable({
            'columns': columns,
            "columnDefs": [
                { className: "text-right", targets: [2, 3, 4] },
                {
                    "targets": hiddenColumns,
                    "visible": false
                }
            ],
            'dom': 't<"navbar navbar-default navbar-fixed-bottom"p>',
            'binfo': false,
            'pagingType': 'full_numbers',
            'info': false,
            "language": {
                "paginate": {
                    "first": '<i class="fa fa-fast-backward"></i>',
                    "last": '<i class="fa fa-fast-forward"></i>',
                    "next": '<i class="fa fa-forward"></i>',
                    "previous": '<i class="fa fa-backward"></i>'
                }
            }
        });
    }

    function createSearchField (nextElement) {

        var search = $('<div>').addClass('input-group search-container').insertBefore(nextElement);
        var searchButton = $('<button>').addClass('btn btn-default').html('<i class="fa fa-search"></i>');
        $('<span>').addClass('input-group-btn').append(searchButton).appendTo(search);
        var searchInput = $('<input>').attr('type', 'text').attr('placeholder', 'Search for...').addClass('search form-control').appendTo(search);
        var focusState = false;

        searchButton.on('click', function () {
            focusState = !focusState;

            searchInput.toggleClass('slideRight');
            searchButton.parent()
                .css('z-index', 20);

            if (focusState) {
                searchInput.focus();
            }
            else {
                searchInput.blur();
            }
        });

        searchInput.on( 'keyup', function () {
            dataTable.api().search(this.value).draw();
        });
    }

    function createModalButton (nextElement) {

        $('<button>')
            .html('<i class="fa fa-plus"></i>')
            .addClass('btn btn-success action-button pull-left')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#uploadFlavorModal')
            .insertBefore(nextElement);
    }

    function createRefreshButton (nextElement, refreshCallback) {

        $('<button>')
            .html('<i class="fa fa-refresh"></i>')
            .addClass('btn btn-default action-button pull-left')
            .click(refreshCallback.bind(null, false))
            .insertBefore(nextElement);
    }

    function createRegionsButton (nextElement) {
        $('<button>')
            .html('<i class="fa fa-globe"></i>')
            .addClass('btn btn-primary action-button pull-left')
            .click(toggleRegionSelector)
            .insertBefore(nextElement);
    }

    function createRegionSelector () {
        var regions = Region.getAvailableRegions();
        var regionSelector = $('<div>')
                .attr('id', 'region-selector')
                .addClass('region-selector')
                .css('max-height', window.innerHeight - 50)
                .appendTo($('body'));


        $(window).resize(function () {
            regionSelector.css('max-height', window.innerHeight - 50);
        });

        regions.forEach(function(region) {

            var checked = false;

            $('<div>')
                .html('<input type="checkbox" name="region" value="' + region + '" /> ' + region)
                .addClass('region-container')
                .click(function (e) {
                    var input = $('input', this);
                    checked = !checked;

                    input.toggleClass('selected');
                    input.prop('checked', checked);

                    Region.setCurrentRegions(regionSelector);
                })
                .appendTo(regionSelector);
        });

        $("div>input[type=checkbox][value=Spain2]").prop("checked", true);
        Region.setCurrentRegions(regionSelector);
    }

    function toggleRegionSelector () {
        $('#region-selector').toggleClass('slideRight');
    }

    function buildTableBody (flavorList, updateCallback, deleteCallback) {

        var row, flavor, displayableRam, displayableDisk, displayableSwap;

        // Launch button
        var wrapper = $('<div>');
        // getEditButtonHTML(wrapper);
        // getDeleteButtonHTML(wrapper);

        // Clear previous elements
        dataTable.api().clear();

        flavorList.forEach(function (flavor) {

            displayableRam = Utils.getDisplayableValue(flavor.ram, "MiB");
            displayableDisk = Utils.getDisplayableValue(flavor.disk, "GiB");
            displayableSwap = Utils.getDisplayableValue(flavor.swap, "MiB");

            row = dataTable.api().row.add([
                flavor.id,
                flavor.name,
                displayableRam,
                flavor.vcpus,
                displayableDisk,
                displayableSwap,
                flavor.region
                // wrapper.html()
            ])
            .draw()
            .nodes()
            .to$();

            if (UI.selectedRowId && flavor.id === UI.selectedRowId) {
                row.addClass('selected');
            }

            // setEditEvents(flavor, updateCallback);

        });
    }

    function setEditEvents (flavor, callback) {

        $('button[name=edit-button]').on('click', function () {
            var row = $(this).parent().parent();

            fillEditForm(flavor);
        });

    }

    function setDeleteButtonEvent (callback) {

        $('button[name=delete-button]').on('click', function () {
            var row = $(this).parent().parent();
            var data = dataTable.api().row(row).data();
            callback(data[0], data[data.length - 2]);
        });

    }

    function setSelectFlavorEvents () {

        // Remove previous row click events
        $('#flavors_table tbody').off('click', '**');

        // Row events
        $('#flavors_table tbody').on('click', 'tr', function () {
            var data = dataTable.api().row(this).data();
            var id = data[0];
            var region = data[data.length - 1];
            UI.selectedRowId = id;

            dataTable.api().row('.selected')
                .nodes()
                .to$()
                .removeClass('selected');
            $(this).addClass('selected');
        });
    }

    function initFixedHeader () {
        UI.fixedHeader = new $.fn.dataTable.FixedHeader(dataTable);
        $(window).resize(redrawFixedHeaders);
    }

    function redrawFixedHeaders () {
        UI.fixedHeader._fnUpdateClones(true); // force redraw
        UI.fixedHeader._fnUpdatePositions();
    }

    function createFormRegionSelector () {

        var availableRegions = Region.getAvailableRegions();
        var currentRegions = Region.getCurrentRegions();
        var regionFormSelector = $('#region');

        availableRegions.forEach(function (region) {
            $('<option>')
                .val(region)
                .text(region)
                .appendTo(regionFormSelector);
        });

        if (currentRegions.length === 1) {
            $('option[value=' + currentRegions[0] + ']').prop('selected', true);
        }

    }

    function getEditButtonHTML (parent) {

        $('<button>')
            .addClass('btn btn-primary')
            .attr('name', 'edit-button')
            .html('<i class="fa fa-pencil-square-o"></i>')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#updateFlavorModal')
            .appendTo(parent);

    }

    function getDeleteButtonHTML (parent) {

        $('<button>')
            .addClass('btn btn-danger')
            .attr('name', 'delete-button')
            .html('<i class="fa fa-trash"></i>')
            .appendTo(parent);

    }

    function fillEditForm (flavor) {

        $('#update-name').val(flavor.name);
        $('#update-ram').val(flavor.ram);
        $('#update-vcpus').val(flavor.vcpus);
        $('#update-disk').val(flavor.disk);
        $('#update-form-region').val(flavor.region);

    }


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function createTable (callbacks) {

        initDataTable();

        // Extra padding to adjust to bottom fixed navbar
        $('#flavors_table_wrapper').attr('style', 'padding-bottom: 40px;');

        // Pagination style
        $('#flavors_table_paginate').addClass('pagination pull-right');

        createRegionSelector();
        createFormRegionSelector();
        createRegionsButton($('#flavors_table_paginate'));
        //createModalButton($('#flavors_table_paginate'));
        createSearchField($('#flavors_table_paginate'));
        createRefreshButton($('#flavors_table_paginate'), callbacks.refresh);

        // Set modal create flavor button click
        $('#create-flavor').on('click', callbacks.create);
        $('#update-flavor').on('click', function (e) {
            var form = $('#update_flavor_form')[0];
            var flavor = {};
            flavor.name = form['update-name'].value;
            flavor.ram = form['update-ram'].value;
            flavor.vcpus = form['update-vcpus'].value;
            flavor.disk = form['update-disk'].value;
            flavor.region = form['update-form-region'].value;
            callbacks.update(flavor);
            e.preventDefault();
            $('#updateFlavorModal').modal('hide');
        });

        initFixedHeader();

    }

    function updateHiddenColumns () {

        var display;
        var preferenceList = [
            'id',
            'name',
            'ram',
            'vcpus',
            'disk',
            'swap'
        ];

        hiddenColumns = [];

        preferenceList.forEach(function (preference, index) {

            display = MashupPlatform.prefs.get(preference);

            if (!display) {
                hiddenColumns.push(index);
            }

            if (dataTable) {
                dataTable.api().column(index).visible(display, false);
            }

        });

        // Recalculate all columns size at once
        if (dataTable) {
            dataTable.api().columns.adjust();
        }

    }

    function drawFlavors (callbacks, autoRefresh, flavorList) {

        // Save previous scroll and page
        var scroll = $(window).scrollTop();
        var page = dataTable.api().page();

        buildTableBody(flavorList, callbacks.update);
        setDeleteButtonEvent(callbacks.destroy);
        setSelectFlavorEvents();

        // Restore previous scroll and page
        $(window).scrollTop(scroll);
        dataTable.api().page(page).draw(false);

        // Adjust columns and headers
        dataTable.api().columns.adjust();
        redrawFixedHeaders();

        if (autoRefresh) {
            setTimeout(function () {
                callbacks.refresh(true);
            }, 4000);
        }
    }

    function startLoadingAnimation (element, icon) {

        var bodyWidth = $('body').width();
        var bodyHeight = $('body').height();

        // Reference size is the smaller between height and width
        var referenceSize = (bodyWidth < bodyHeight) ? bodyWidth : bodyHeight;
        var font_size = referenceSize / 4;

        icon.css('font-size', font_size);
        element.removeClass('hide');

    }

    function stopLoadingAnimation (element) {
        element.addClass('hide');
    }

    function clearTable () {
        dataTable.api().clear();
        dataTable.api().draw();
    }

    return {
        createTable: createTable,
        updateHiddenColumns: updateHiddenColumns,
        drawFlavors: drawFlavors,
        startLoadingAnimation: startLoadingAnimation,
        stopLoadingAnimation: stopLoadingAnimation,
        clearTable: clearTable
    };
})();
