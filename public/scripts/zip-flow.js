var LAST_ZIP_DB_KEY = "lastZipCode";

var renderNonForecastElements = function(){
    $("#zipcode").text(this.zipCode);
}

var setUpEventListeners = function () {

    var self = this;

    $("#zipcode").click(function () {
        var newZip = prompt("what zip code?");

        if (!newZip) {
            return;
        }

        getGeoPointsForZipCodeAsync(newZip).done(function (geoPoints) {
            if (geoPoints) {
                setIndexedDbItem(LAST_ZIP_DB_KEY, newZip, function () {
                    redirectToZipCode(newZip);
                });
            } else {
                alert("That was not a zip code, dummy face.")
            }
        });
    });
}

var redirectToZipCode = function (zipCode) {
    var params = new URLSearchParams(window.location.search);
    var baseUrl = window.location.origin + window.location.pathname;

    params.delete("zip");
    params.set("zip", zipCode);

    window.location.replace(baseUrl + "?" + params.toString());
}

var validateUrl = function (onSuccess) {

    var self = this;
    var fallbackZipCode = "90210";
    var resolveZip;
    var useZipCode;

    this.urlParams = new URLSearchParams(window.location.search);

    useZipCode = function (zipCode, shouldRedirect) {
        setIndexedDbItem(LAST_ZIP_DB_KEY, zipCode, function () {
            if (shouldRedirect) {
                redirectToZipCode(zipCode);
            } else {
                self.zipCode = zipCode;
                onSuccess();
            }
        });
    };

    resolveZip = function (zipCode, callback) {
        getGeoPointsForZipCodeAsync(zipCode).done(function (geoPoints) {
            callback(geoPoints ? zipCode : undefined);
        });
    };

    resolveZip(this.urlParams.get("zip"), function (validUrlZipCode) {
        if (validUrlZipCode) {
            useZipCode(validUrlZipCode, false);
            return;
        }

        getIndexedDbItem(LAST_ZIP_DB_KEY, function (storedZipCode) {
            resolveZip(storedZipCode, function (validStoredZipCode) {
                if (validStoredZipCode) {
                    useZipCode(validStoredZipCode, true);
                } else {
                    useZipCode(fallbackZipCode, true);
                }
            });
        });
    });
}
