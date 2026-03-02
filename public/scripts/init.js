var addLoadEvent = function(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            if (oldonload) {
                oldonload();
            }
            func();
        }
    }
}

var getWeatherData = function (onSuccess) {

    var getActiveAlertsForPoint = function (point) {

        var deferred = $.Deferred();

        $.get("https://api.weather.gov/alerts/active?point=" + encodeURIComponent(point))
            .done(function (alertsData) {
                deferred.resolve(alertsData);
            })
            .fail(function () {
                deferred.resolve({ features: [] });
            });

        return deferred.promise();
    }

    var point = getGeoPointsForZipCode(this.zipCode);

    $.get(
        "https://api.weather.gov/points/" + point,
        function (geoPointsInfo) {
            $.when(
                $.get(geoPointsInfo.properties.forecastGridData),
                $.get(geoPointsInfo.properties.forecastHourly),
                getActiveAlertsForPoint(point)
            ).done(function (gridResponse, hourlyResponse, alertsData) {
                var gridData = gridResponse[0];
                var hourlyData = hourlyResponse[0];
                var periodIndexByStartTime = getPeriodIndexByStartTime(hourlyData);

                populateChanceOfRainIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                populateAmountofRainIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                populateHumidityIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                onSuccess(hourlyData, gridData, alertsData);
            }).fail(function(){
                // getWeatherData(onSuccess);
                // console.log("forecast data fail");
            });
        }
    )
}

var initialize = function () {
    renderPlaceHolderTable();
    validateUrl(function () {
        setUpEventListeners();
        getWeatherData(function (hourlyData, gridData, alertsData) {
            renderWeatherData(hourlyData, gridData);
            renderHazardMessages(alertsData);
            renderForecastMeta(hourlyData, gridData);
        });
        renderNonForecastElements();
    });
}

addLoadEvent(initialize);
