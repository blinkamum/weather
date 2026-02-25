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
                    window.location.href = window.location.href.replace(self.zipCode.toString(), newZip);
                });
            } else {
                alert("That was not a zip code, dummy face.")
            }
        });
    });
}

var redirectToZipCode = function (zipCode) {

    var hasSearchParameters = false;
    var baseUrl = window.location.href.substring(0, window.location.href.indexOf(".html") + 5);
    var firstParam = true;

    this.urlParams.forEach(function (value, key) {
        if (key !== "zip") {
            hasSearchParameters = true;
            if (firstParam) {
                baseUrl = baseUrl + "?"
                firstParam = false;
            } else {
                baseUrl = baseUrl + "&"
            }
            baseUrl = baseUrl + key + "=" + value
        }
    });

    window.location.replace(baseUrl + (hasSearchParameters ? "&" : "?") + "zip=" + zipCode);
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
