var LAST_ZIP_DB_KEY = "lastZipCode";
var ZIP_COPY_MODE = "friendly";
var ZIP_COPY_MODE_STORAGE_KEY = "zipCopyMode";
var zipModeBannerTimer;

var toggleZipCopyMode = function () {
    ZIP_COPY_MODE = ZIP_COPY_MODE === "friendly" ? "1988-terminal-gremlin" : "friendly";
    setLocalStorageItem(ZIP_COPY_MODE_STORAGE_KEY, ZIP_COPY_MODE);

    if (zipModeBannerTimer) {
        clearTimeout(zipModeBannerTimer);
    }

    if (ZIP_COPY_MODE === "1988-terminal-gremlin") {
        renderZipValidationMessage("MODE: 1988 TERMINAL GREMLIN // BOOT OK");
    } else {
        renderZipValidationMessage("MODE: FRIENDLY // HUMAN INTERFACE RESTORED");
    }

    zipModeBannerTimer = setTimeout(function () {
        renderZipValidationMessage("");
    }, 2200);
}

var initializeZipCopyMode = function () {
    var storedMode = getLocalStorageItem(ZIP_COPY_MODE_STORAGE_KEY);

    if (storedMode === "friendly" || storedMode === "1988-terminal-gremlin") {
        ZIP_COPY_MODE = storedMode;
    }
}

var getZipCopy = function () {
    if (ZIP_COPY_MODE === "1988-terminal-gremlin") {
        return {
            prompt: "ZIP?> _",
            invalid: function (input) {
                return "INPUT \"" + input + "\" REJECTED. EXPECTED 5 DIGITS. TRY 90210.";
            }
        };
    }

    return {
        prompt: "Enter a 5-digit ZIP code:",
        invalid: function (input) {
            return "\"" + input + "\" isn’t a valid ZIP code. Please enter a 5-digit ZIP (example: 90210).";
        }
    };
}

var renderZipValidationMessage = function (message) {
    $("#zipValidationMessage").text(message || "");
}

var renderNonForecastElements = function(){
    $("#zipcode").text(this.zipCode);
}

var setUpEventListeners = function () {

    var self = this;

    $(document).off("keydown.zipCopyModeToggle").on("keydown.zipCopyModeToggle", function (event) {
        var isObscureToggle = event.ctrlKey && event.altKey && event.shiftKey && (event.code === "Backquote" || event.key === "`");

        if (isObscureToggle) {
            event.preventDefault();
            toggleZipCopyMode();
        }
    });

    $("#zipcode").click(function () {
        var copy = getZipCopy();
        var newZip = prompt(copy.prompt);

        renderZipValidationMessage("");

        if (!newZip) {
            return;
        }

        getGeoPointsForZipCodeAsync(newZip).done(function (geoPoints) {
            if (geoPoints) {
                setIndexedDbItem(LAST_ZIP_DB_KEY, newZip, function () {
                    redirectToZipCode(newZip);
                });
            } else {
                renderZipValidationMessage(copy.invalid(newZip));
            }
        });
    });
}

var redirectToZipCode = function (zipCode) {
    var normalizedTargetZip = zipCode ? zipCode.toString() : "";
    var currentZip = new URLSearchParams(window.location.search).get("zip");

    if (currentZip === normalizedTargetZip) {
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var baseUrl = window.location.origin + window.location.pathname;

    params.delete("zip");
    params.set("zip", normalizedTargetZip);

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

initializeZipCopyMode();
