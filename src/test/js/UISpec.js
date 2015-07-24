/* global UI */

describe('User Interface', function () {
	"use strict";

	var listFlavors = null;
    var respFlavorList = null;
    var respAuthenticate = null;
    var flavorListSingleFlavor = null;
    var drawCallbacks;
	var prefsValues;

    beforeEach(function () {
    	// Set preferences values
        prefsValues = {
            "MashupPlatform.prefs.get": {
                "id": false,
                "name": true,
                "ram": true,
                "vcpus": true,
                "disk": true,
                "swap": true
            }
        };

        MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

        // Load fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respFlavorList = getJSONFixture('respFlavorList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        flavorListSingleFlavor = getJSONFixture('flavorListSingleFlavor.json');

        respAuthenticate.token.serviceCatalog = respAuthenticate.token.catalog;
        JSTACK.Keystone.params.access = respAuthenticate.token;

        // Callbacks spies
        drawCallbacks = jasmine.createSpyObj('drawCallbacks', ['refresh', 'create']);

        // Draw default columns
        UI.createTable(drawCallbacks);
        UI.updateHiddenColumns();
    });

    afterEach(function () {
        $('#flavors_table').empty();
        $('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
    });


    /**************************************************************************/
    /*                     I N T E R F A C E   T E S T S                      */
    /**************************************************************************/

    it('should make the columns given in the preferences visible', function () {

        var columns;
        var expectedColumns = [
            'Name',
            'Ram',
            'VCPUs',
            'Disk',
            'Swap',
            'Region',
            'Actions'
        ];

        UI.drawFlavors(drawCallbacks, false, flavorListSingleFlavor.flavors);
        
        columns = $('.fixedHeader th');

        for (var i=0; i<columns.length; i++) {

            expect(columns[i].textContent).toEqual(expectedColumns[i]);
        }

    });

    it('should dynamically change the displayed columns when preferences change', function () {

        var columns, handlePreferences;
        var expectedColumns = [
            'ID',
            'Ram',
            'VCPUs',
            'Swap',
            'Region',
            'Actions'
        ];

        // Change preferences
        prefsValues["MashupPlatform.prefs.get"].id = true;
        prefsValues["MashupPlatform.prefs.get"].name = false;
        prefsValues["MashupPlatform.prefs.get"].ram = true;
        prefsValues["MashupPlatform.prefs.get"].vcpus = true;
        prefsValues["MashupPlatform.prefs.get"].disk = false;
        prefsValues["MashupPlatform.prefs.get"].swap = true;

        UI.updateHiddenColumns();
        UI.drawFlavors(drawCallbacks, false, respFlavorList.flavors);

        columns = $('.fixedHeader th');

        for (var i=0; i<columns.length; i++) {
            expect(columns[i].textContent).toEqual(expectedColumns[i]);
        }
    });

	it('should call MashupPlatform.wiring.pushEvent when click event triggered on a row', function () {

        var spyEvent = spyOnEvent('tbody > tr', 'click');
        var flavorId;

        UI.drawFlavors(drawCallbacks, false, respFlavorList.flavors);
        
        $('tbody > tr').trigger('click');

        for (var i=0; i<respFlavorList.flavors.length; i++) {

            if (respFlavorList.flavors[i].id === JSON.parse(MashupPlatform.wiring.pushEvent.calls.mostRecent().args[1]).id) {
                flavorId = respFlavorList.flavors[i].id;
            }
        }

        expect(MashupPlatform.wiring.pushEvent).toHaveBeenCalled();
        expect(flavorId).toBeDefined();
    });

    it('should add the given row', function() {

        prefsValues["MashupPlatform.prefs.get"].id = true;
        prefsValues["MashupPlatform.prefs.get"].name = true;
        prefsValues["MashupPlatform.prefs.get"].ram = true;
        prefsValues["MashupPlatform.prefs.get"].disk = true;
        prefsValues["MashupPlatform.prefs.get"].swap = true;
        prefsValues["MashupPlatform.prefs.get"].vcpus = true;

        var flavor = flavorListSingleFlavor.flavors[0];
        var expectedTextList = [
            flavor.id,
            flavor.name,
            flavor.ram,
            flavor.vcpus,
            flavor.disk,
            flavor.swap,
            flavor.region
        ];
        var cell;

        UI.updateHiddenColumns();
        UI.drawFlavors(drawCallbacks, false, flavorListSingleFlavor.flavors);                

        for (var i=0; i<expectedTextList.length; i++) {
            
            cell = $('tbody > tr > td')[i];
            expect(cell).toContainText(expectedTextList[i]);
        }
    });

    it('should start loading animation with width lesser than the height', function () {
        
        var bodyWidth = 100;

        $('body').width(bodyWidth);
        $('body').height(bodyWidth + 100);
        
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyWidth/4) + 'px');

        // Return to original state
        UI.stopLoadingAnimation($('.loading'));
    });

    it('should start loading animation with height lesser than the width', function () {
        
        var bodyHeight = 100;
        
        $('body').width(bodyHeight + 100);
        $('body').height(bodyHeight);

        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyHeight/4) + 'px');

        // Return to original state
        UI.stopLoadingAnimation($('.loading'));
    });

    it('should correctly search flavors when new data is introduced in the input field', function () {

        var spyEvent = spyOnEvent('.search-container input', 'keyup');
        
        $('.search-container input')
            .val('RealVirtualInteractionGE-3.3.3')
            .trigger('keyup');

        expect('keyup').toHaveBeenTriggeredOn('.search-container input');
        expect($('tbody').children().size()).toBe(1);
    });

    it('should expand the search bar', function () {
        var searchButton = $('.search-container button');
        var spyEvent = spyOnEvent('.search-container button', 'click');

        searchButton.click();

        expect('click').toHaveBeenTriggeredOn('.search-container button');
        expect('.search-container input').toHaveClass('slideRight');
        expect('.search-container input').toBeFocused();

        // Return to original state
        searchButton.click();
    });

    it('should collapse the search bar', function () {
        var searchButton = $('.search-container button');

        searchButton.click();
        searchButton.click();

        expect('.search-container input').not.toHaveClass('slideRight');
        expect('.search-container input').not.toBeFocused();
    });

    it('should expand the region selector', function () {
        var regionButton = $('button .fa-globe');
        var spyEvent = spyOnEvent('button .fa-globe', 'click');

        regionButton.click();

        expect('click').toHaveBeenTriggeredOn('button .fa-globe');
        expect('#region-selector').toHaveClass('slideRight');

        // Return to original state
        regionButton.click();
    });

    it('should collapse the region selector', function () {
        var regionButton = $('button .fa-globe');

        regionButton.click();
        regionButton.click();

        expect('#region-selector').not.toHaveClass('slideRight');
    });

    it('should select a region after clicking on its selector', function () {
        var regionSelector = $('input[value=Spain2]').parent();

        regionSelector.click();

        expect('input[value=Spain2]').toHaveClass('selected');
        expect('input[value=Spain2]').toHaveProp('checked', true);

        // Return to original state
        regionSelector.click();
    });

    it('should select a region after clicking on its selector', function () {
        var regionSelector = $('input[value=Spain2]').parent();

        regionSelector.click();
        regionSelector.click();

        expect('input[value=Spain2]').not.toHaveClass('selected');
        expect('input[value=Spain2]').toHaveProp('checked', false);
        
    });
});