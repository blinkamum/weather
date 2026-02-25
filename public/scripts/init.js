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

    $.get(
        "https://api.weather.gov/points/" + getGeoPointsForZipCode(this.zipCode),
        function (geoPointsInfo) {
            $.when(
                $.get(geoPointsInfo.properties.forecastGridData),
                $.get(geoPointsInfo.properties.forecastHourly)
            ).done(function (gridResponse, hourlyResponse) {
                var gridData = gridResponse[0];
                var hourlyData = hourlyResponse[0];
                var periodIndexByStartTime = getPeriodIndexByStartTime(hourlyData);

                populateChanceOfRainIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                populateAmountofRainIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                populateHumidityIntoHourlyData(gridData, hourlyData, periodIndexByStartTime);
                onSuccess(hourlyData, gridData);
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
        getWeatherData(renderWeatherData);
        renderNonForecastElements();
    });
}

addLoadEvent(initialize);
