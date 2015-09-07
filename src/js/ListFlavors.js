/* global Utils,UI,Region */

var ListFlavors = (function (JSTACK) {
    "use strict";

    var ERRORS = {
        '500 Error': 'An error has occurred in FIWARE\'s Cloud.',
        '503 Error': 'FIWARE\'s Cloud service is not available at the moment.',
        '422 Error': 'You are not authenticated in the wirecloud platform.'
    };

    var authURL = 'https://cloud.lab.fiware.org/keystone/v3/auth/';


    /******************************************************************/
    /*                      C O N S T R U C T O R                     */
    /******************************************************************/

    function ListFlavors () {

        this.init = init;
        this.authenticate = authenticate;
        this.listFlavor = getFlavorList;
        this.createFlavor = createFlavor;
        this.editFlavor = editFlavor;
        this.deleteFlavor = deleteFlavor;

    }


    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function handlePreferences () {

        UI.updateHiddenColumns();

    }

    function readFormFields (form) {

        var fields = {};

        $.each(form.serializeArray(), function(i, field) {
            if (field.value !== "") {
                fields[field.name] = field.value;
            }
        });

        return fields;
    }

    function createWidgetUI (tokenResponse) {

        var callbacks = {
            create: createFlavor,
            refresh: getFlavorList,
            update: editFlavor
        };
        
        var token = tokenResponse.getHeader('x-subject-token');
        var responseBody = JSON.parse(tokenResponse.responseText);

        // Temporal change to fix catalog name
        responseBody.token.serviceCatalog = responseBody.token.catalog;

        // Mimic JSTACK.Keystone.authenticate behavior on success
        JSTACK.Keystone.params.token = token;
        JSTACK.Keystone.params.access = responseBody.token;
        JSTACK.Keystone.params.currentstate = 2;

        UI.stopLoadingAnimation($('.loading'));
        UI.createTable(callbacks);
        getFlavorList(true);

    }

    function onError (error) {

        if (error.message in ERRORS) {
            Utils.createAlert('danger', 'Error', ERRORS[error.message], error.region, error);
        }
        else {
            Utils.createAlert('danger', error.message, error.body, error.region);
        }

        console.log('Error: ' + JSON.stringify(error));
    }

    function authError (error) {
        error = error.error;
        onError({message: error.code + " " + error.title, body: error.message, region: "IDM"});
        authenticate();
    }

    function createJoinRegions (regionsLimit, autoRefresh) {

        var currentFlavorList = [];
        var errorList = [];

        function deductRegionLimit () {

            regionsLimit -= 1;

            if (regionsLimit === 0) {

                var callbacks = {
                    refresh: getFlavorList,
                    destroy: deleteFlavor
                };

                UI.drawFlavors(callbacks, autoRefresh, currentFlavorList);
                drawErrors();
            }
        }

        function drawErrors () {
            if (errorList.length === 0) return;

            errorList.forEach(function (error) {
                onError(error);
            });
        }

        function joinRegionsSuccess (region, flavorList) {

            flavorList.flavors.forEach(function (flavor) {
                flavor.region = region;
                currentFlavorList.push(flavor);
            });

            deductRegionLimit();
        }

        function joinRegionsErrors (region, error) {

            error.region = region;
            errorList.push(error);

            deductRegionLimit();
        }

        return {
            success: joinRegionsSuccess,
            error: joinRegionsErrors
        };
    }


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function init () {

        // Initialize preferences
        handlePreferences();

        // Preferences handler
        MashupPlatform.prefs.registerCallback(handlePreferences);

    }

    function authenticate () {
        
        var headersAuth = {
            "X-FI-WARE-OAuth-Token": "true",
            "X-FI-WARE-OAuth-Token-Body-Pattern": "%fiware_token%",
            "Accept": "application/json"
        };

        var authBody = {
            "auth": {
                "identity": {
                    "methods": [
                        "oauth2"
                    ],
                    "oauth2": {
                        "access_token_id": "%fiware_token%"
                    }
                }
            }
        };

        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        // Get token with user's FIWARE token
        MashupPlatform.http.makeRequest(authURL + 'tokens', {
            method: 'POST',
            requestHeaders: headersAuth,
            contentType: "application/json",
            postBody: JSON.stringify(authBody),
            onSuccess: createWidgetUI,
            onFailure: authError
        });
        
    }

    function createFlavor (e) {

        var token = JSTACK.Keystone.params.token;
        var form = $('#create_flavor_form');
        var fields = readFormFields(form);

        var region = $('#region').find(":selected").val();

        JSTACK.Nova.createflavor(
            fields.name,
            fields.ram,
            fields.vcpus,
            fields.disk,
            fields.id,
            getFlavorList,
            onError,
            region
        );

        // Reset form, prevent submit and close modal
        form[0].reset();
        e.preventDefault();
        $('#uploadFlavorModal').modal('hide');

    }

    function editFlavor (flavor) {

        JSTACK.Nova.deleteflavor(flavor.id, function () {
            
            JSTACK.Nova.createflavor(
                flavor.name,
                flavor.ram,
                flavor.vcpus,
                flavor.disk,
                flavor.id,
                undefined,
                undefined,
                undefined,
                getFlavorList,
                onError,
                flavor.region
            );

        }, onError, flavor.region);

    }

    function deleteFlavor (id, region) {
        JSTACK.Nova.deleteflavor(id, getFlavorList, onError, region);
    }

    function getFlavorList (autoRefresh) {

        var regions = Region.getCurrentRegions();
        var joinRegions = createJoinRegions(regions.length, autoRefresh);

        regions.forEach(function (region) {
            JSTACK.Nova.getflavorlist(true, joinRegions.success.bind(null, region), joinRegions.error.bind(null, region), region);
        });
    }

    return ListFlavors;
})(JSTACK);
