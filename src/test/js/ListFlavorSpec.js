/* global ListFlavors,UI */

describe('List Flavor', function () {
    "use strict";

    var listFlavors = null;
    var respFlavorList = null;
    var respAuthenticate = null;
    var flavorListSingleFlavor = null;

    beforeEach(function() {

        // Set strategy
        MashupPlatform.setStrategy(new MyStrategy(), undefined);

        // Load fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respFlavorList = getJSONFixture('respFlavorList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        flavorListSingleFlavor = getJSONFixture('flavorListSingleFlavor.json');

        // Create new instance
        listFlavors = new ListFlavors();
        listFlavors.init();

    });

    afterEach(function () {

        MashupPlatform.reset();
        jasmine.resetAll(JSTACK.Keystone);
        jasmine.resetAll(JSTACK.Nova);
        $('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();

    });


    /**************************************************************************/
    /*                  A U X I L I A R   F U N C T I O N S                   */
    /**************************************************************************/

    function callListFlavor() {

        var createWidgetUI;

        listFlavors.authenticate();

        createWidgetUI = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
        respAuthenticate = {
            responseText: JSON.stringify(respAuthenticate),
            getHeader: function () {}
        };
        createWidgetUI(respAuthenticate);
        
    }

    function callAuthenticateWithError (error) {
        
        var authError;

        authError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
        authError(error);

    }

    function callListFlavorSuccessCallback (flavorList) {

        var callback = JSTACK.Nova.getflavorlist.calls.mostRecent().args[1];
        
        callback(flavorList);

    }

    function callListFlavorErrorCallback (error) {

        var callback = JSTACK.Nova.getflavorlist.calls.mostRecent().args[2];

        callback(error);
    }

    /**************************************************************************/
    /*                  F U N C T I O N A L I T Y   T E S T S                 */
    /**************************************************************************/

    it('should authenticate through wirecloud proxy', function() {

        var stopLoadingAnimationSpy = spyOn(UI, 'stopLoadingAnimation');

        callListFlavor();

        expect(MashupPlatform.http.makeRequest.calls.count()).toBe(1);
        expect(JSTACK.Keystone.params.currentstate).toBe(2);

    });

    it('should have created a table with the received flavors', function () {

        callListFlavor();
        callListFlavorSuccessCallback(respFlavorList);

        var rows = document.querySelectorAll('tbody > tr');

        expect(rows.length).toBeGreaterThan(0);
    });

    it('should call error callback when authentication fails', function () {
        
        var consoleSpy = spyOn(console, "log"); // REFACTOR

        callListFlavor();
        callAuthenticateWithError({"error": {"message": "An unexpected error prevented the server from fulfilling your request.", "code": 500, "title": "Internal Server Error"}});
        expect(consoleSpy.calls.mostRecent().args[0]).toBe("Error: " + JSON.stringify({message: "500 Internal Server Error", body: "An unexpected error prevented the server from fulfilling your request.", region: "IDM"}));
    });

    it('should call error callback for getFlavorList correctly', function () {

        var error = {message: 'Error 404', body: 'Flavor not found'};
        var spyLog = spyOn(console, 'log');

        callListFlavor();
        callListFlavorErrorCallback(error);

        expect(spyLog).toHaveBeenCalledWith("Error: " + JSON.stringify(error));
    });

    it('should call getserverlist 4 seconds after receiving the last update', function () {

        var refresh;
        var setTimeoutSpy = spyOn(window, 'setTimeout');

        callListFlavor();
        callListFlavorSuccessCallback(flavorListSingleFlavor);
        refresh = setTimeout.calls.mostRecent().args[0];
        refresh();

        expect(JSTACK.Nova.getflavorlist).toHaveBeenCalled();
        expect(setTimeoutSpy).toHaveBeenCalledWith(jasmine.any(Function), 4000);
    });

    /*it('should call createFlavor function when click event is triggered on the create flavor button', function () {

        var createButton = $("#create-flavor");
        var spyEvent, region;

        var id = $("#id").val("123").val();
        var name = $("#name").val("123").val();
        var ram = $("#ram").val("123").val();
        var vcpus = $("#vcpus").val("123").val();
        var disk = $("#disk").val("123").val();

        callListFlavor();
        callListFlavorSuccessCallback(respFlavorList);

        region = $('#id_region').find(":selected").val();
        
        spyEvent = spyOnEvent(createButton, 'click');
        createButton.trigger('click');

        expect('click').toHaveBeenTriggeredOn('#create-flavor');
        expect(JSTACK.Nova.createflavor).toHaveBeenCalledWith(name, ram, vcpus, disk, id, undefined, undefined, undefined, jasmine.any(Function), jasmine.any(Function), region);

    });*/

    it('should show an error alert with the message' + 
       ' received writen on it when ir doesn\'t recognize the error', function () {

        var flavorId = 'id';
        var error = {message: "404 Error", body: "Flavor not found"};

        callListFlavor();
        callListFlavorErrorCallback(error);

        expect($('.alert > strong').last().text()).toBe(error.message + ' ');
        expect($('.alert > span').last().text()).toBe(error.body + ' ');

    });

    it('should display the error details when a click event is' + 
       ' triggered in the details button', function () {

        var flavorId = 'id';
        var spyEvent = spyOnEvent('.alert a', 'click');
        var error = {message: "500 Error", body: "Internal Server Error"};

        callListFlavor();
        callListFlavorErrorCallback(error);
        
        $('.alert a').trigger('click');
        
        expect($('.alert > div').last()).not.toHaveCss({display: "none"});

    });

});
