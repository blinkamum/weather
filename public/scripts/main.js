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

    var firstPeriod;
    var loopCounter;
    var newHourlyData;
    var time;
    var timeSpan;
    var timeUnit;

    $.get(
        "https://api.weather.gov/points/" + getGeoPointsForZipCode(this.zipCode),
        function (geoPointsInfo) {
            // console.log(geoPointsInfo.properties.forecastGridData);
            $.get(
                geoPointsInfo.properties.forecastGridData,
                function (gridData) {
                    // console.log(gridData);
                    newHourlyData = getEmptyHourlyDataObject();
                    //populateChanceOfRainIntoHourlyData(gridData, newHourlyData);
                    // populateAmountofRainIntoHourlyData(gridData, newHourlyData);
                    // populateHumidityIntoHourlyData(gridData, newHourlyData);
                    $.get(
                        geoPointsInfo.properties.forecastHourly,
                        function (hourlyData) {                            
                            populateChanceOfRainIntoHourlyData(gridData, hourlyData);
                            populateAmountofRainIntoHourlyData(gridData, hourlyData);
                            populateHumidityIntoHourlyData(gridData, hourlyData);
                            // console.log(hourlyData)
                            onSuccess(hourlyData, gridData);
                        }
                    ).fail(function () {
                        // getWeatherData(onSuccess);
                        // console.log("hourlyData fail");
                    });
                }
            ).fail(function(){
                // getWeatherData(onSuccess);
                // console.log("gridData fail");
            });
        }
    )
}

var getEmptyHourlyDataObject = function () {

    var newHourlyData;
    var currentTimeBeingProccessed;

    newHourlyData = {};
    newHourlyData.properties = {};
    newHourlyData.properties.periods = [];

    currentTimeBeingProccessed = new moment().startOf('day');

    for (var i = 0; i < 120; i++) {
        newHourlyData.properties.periods[i] = {
            startTime: currentTimeBeingProccessed
        };

        currentTimeBeingProccessed.add(1, 'hour');
    }

    return newHourlyData;
}

var initialize = function () {
    renderPlaceHolderTable();
    validateUrl();
    setUpVariables();
    setUpEventListeners();
    getWeatherData(renderWeatherData);
    renderNonForecastElements();
}

var populateAmountofRainIntoHourlyData = function (gridData, hourlyData) {

    var numberOfHours;

    gridData.properties.quantitativePrecipitation.values.forEach(function (amountOfRain) {

        time = amountOfRain.validTime.split("/")[0];
        timeSpan = amountOfRain.validTime.split("/")[1];
        timeUnit = timeSpan.charAt(timeSpan.length - 1);
        timeUnitCount = timeSpan.replace("P", "").replace("T", "").replace(timeSpan.charAt(timeSpan.length - 1), "");

        if (timeUnit === "H") {
            numberOfHours = timeUnitCount
        } else {
            numberOfHours = 24 * timeUnitCount
        }

        firstPeriod = hourlyData.properties.periods.find(function (period) {
            return moment(time).isSame(moment(period.startTime));
        });

        if (firstPeriod && (parseFloat(amountOfRain.value) / 25.4).toFixed(2) > 0) {
            firstPeriod.amountOfRain = (parseFloat(amountOfRain.value) / 25.4).toFixed(2) + "\" >";
            for (var i = 0; i < numberOfHours - 1; i++) {
                if (hourlyData.properties.periods[firstPeriod.number + i] !== undefined) {
                    if (i + 2 === parseInt(numberOfHours)) {
                        hourlyData.properties.periods[firstPeriod.number + i].amountOfRain = "-> |";
                    } else {
                        hourlyData.properties.periods[firstPeriod.number + i].amountOfRain = "->";
                    }
                }
            }
        }
    });    
}

var populateChanceOfRainIntoHourlyData = function (gridData, hourlyData, debug) {

    gridData.properties.probabilityOfPrecipitation.values.forEach(function (chanceOfRain) {

        time = chanceOfRain.validTime.split("/")[0];
        timeSpan = chanceOfRain.validTime.split("/")[1];
        timeUnit = timeSpan.charAt(timeSpan.length - 1);
        timeUnitCount = timeSpan.replace("P", "").replace("T", "").replace(timeSpan.charAt(timeSpan.length - 1), "");

        if (timeUnit === "H") {
            loopCounter = timeUnitCount
        } else {
            loopCounter = 24 * timeUnitCount
        }

        if (!hourlyData.properties.periods) {
            hourlyData.properties.periods = [];
        }

        firstPeriod = hourlyData.properties.periods.find(function (period) {
            return moment(time).toString() === moment(period.startTime).toString();
        });

        if (firstPeriod) {
            for (var i = 0; i < loopCounter; i++) {
                if (hourlyData.properties.periods[firstPeriod.number - 1 + i] !== undefined) {
                    hourlyData.properties.periods[firstPeriod.number - 1 + i].probabilityOfPrecipitation = chanceOfRain.value;
                }
            }
        }
    });
}

var populateHumidityIntoHourlyData = function (gridData, hourlyData) {

    gridData.properties.dewpoint.values.forEach(function (dewPoint) {

        time = dewPoint.validTime.split("/")[0];
        timeSpan = dewPoint.validTime.split("/")[1];
        timeUnit = timeSpan.charAt(timeSpan.length - 1);
        timeUnitCount = timeSpan.replace("P", "").replace("T", "").replace(timeSpan.charAt(timeSpan.length - 1), "");

        if (timeUnit === "H") {
            loopCounter = timeUnitCount
        } else {
            loopCounter = 24 * timeUnitCount
        }

        firstPeriod = hourlyData.properties.periods.find(function (period) {
            return moment(time).toString() === moment(period.startTime).toString();
        });

        if (firstPeriod) {
            for (var i = 0; i < loopCounter; i++) {
                if (hourlyData.properties.periods[firstPeriod.number - 1 + i] !== undefined) {
                    hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint = parseInt((dewPoint.value * 9 / 5) + 32);
                    // console.log(hourlyData.properties.periods[firstPeriod.number - 1 + i].probabilityOfPrecipitation);
                    // console.log(hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint);
                    // console.log(hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint < 63);
                    if (hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint < 63) {
                        // console.log("nice");
                        hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint = "nice"
                    } else if (hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint < 71) {
                        hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint = "blah"
                    } else {
                        hourlyData.properties.periods[firstPeriod.number - 1 + i].dewPoint = "gross"
                    }
                    // console.log("============================");
                }
            }
        }
    });
}

var renderNonForecastElements = function(){
    $("#zipcode").text(this.zipCode || getLocalStorageItem("zip"));
}

var renderPlaceHolderTable = function () {

    var cell;
    var currentTimeBeingProccessed;
    var dayAndHour;
    var dayName;
    var dayNameLowerCase;
    var forecastClass;
    var row;
    var tempClass;

    currentTimeBeingProccessed = new moment().startOf('day');

    for (var i = 0; i < 5; i++) {

        dayName = currentTimeBeingProccessed.format('ddd');
        dayNameLowerCase = dayName.toLowerCase();
        row = $(document.createElement("tr")).addClass(dayNameLowerCase);

        $("#weathertable").append(row);

        for (var ii = 0; ii < 25; ii++) {
            cell = $(document.createElement("td")).addClass("has-text-centered is-paddingless");
            if (ii === 0) {
                cell.addClass("is-size-7").append(dayName)
                row.append(cell);
            } else {
                
                dayAndHour = dayNameLowerCase + "_" + currentTimeBeingProccessed.format('HH');
                tempClass = "unknown";
                forecastClass = "unknown"
                
                cell.addClass(tempClass).addClass(dayAndHour);
                row.append(cell);
                cell.append("<span></span><br><i class='" + forecastClass + "'></i><br><span class='probnumber'></span>");
                
                currentTimeBeingProccessed.add(1, 'hour');
            }
        }
    }

}

var renderWeatherData = function (hourlyData, gridData) {
    
    var amountOfRain;
    var cell;
    var currentTimeBeingProccessed;
    var dayName;
    var dayNameLowerCase;
    var dewPoint;
    var forecastClass;
    var lastWindSpeedAndDirection;
    var periodBeingProcessed;
    var probabilityOfPrecipitation;
    var row;
    var startedProcessingData;
    var temp;
    var tempClass;
    var windDirection;
    var windSpeed;

    startedProcessingData = false;
    periodBeingProcessed = 0;
    currentTimeBeingProccessed = new moment().startOf('day');
    lastWindSpeedAndDirection = "";

    $("#weathertable").html("");

    while (new moment(hourlyData.properties.periods[periodBeingProcessed].startTime).toISOString() < currentTimeBeingProccessed.toISOString()){
        periodBeingProcessed++;
    }
    
    for (var i = 0; i < 5; i++) {

        dayName = currentTimeBeingProccessed.format('ddd');
        dayNameLowerCase = dayName.toLowerCase();
        row = $(document.createElement("tr")).addClass(dayNameLowerCase);        
    
        $("#weathertable").append(row);
    
        for (var ii = 0; ii < 25; ii++) {

            cell = $(document.createElement("td")).addClass("has-text-centered is-paddingless");
            if (ii === 0) {
                cell.addClass("is-size-7").append(dayName)
                row.append(cell);
            } else {
                if (new moment(hourlyData.properties.periods[periodBeingProcessed].startTime).toISOString() === currentTimeBeingProccessed.toISOString()) {
                    startedProcessingData = true;
                }
                var dayAndHour = dayNameLowerCase + "_" + currentTimeBeingProccessed.format('HH');
                if (startedProcessingData) {

                    amountOfRain = hourlyData.properties.periods[periodBeingProcessed].amountOfRain;
                    amountOfRain = amountOfRain === undefined ? "&nbsp;" : amountOfRain;
                    forecastClass = getForecastClasses(hourlyData.properties.periods[periodBeingProcessed], hourlyData.properties.periods[periodBeingProcessed].probabilityOfPrecipitation);
                    probabilityOfPrecipitation = hourlyData.properties.periods[periodBeingProcessed].probabilityOfPrecipitation > 10 ? hourlyData.properties.periods[periodBeingProcessed].probabilityOfPrecipitation + "%" : "";
                    temp = hourlyData.properties.periods[periodBeingProcessed].temperature;
                    tempClass = "temp" + (temp < 1 ? 0 : temp);
                    tempClass = temp < 33 ? tempClass + " freezing" : tempClass;
                    windDirection = hourlyData.properties.periods[periodBeingProcessed].windDirection;
                    windSpeed = hourlyData.properties.periods[periodBeingProcessed].windSpeed.replace(" mph", "");
                    dewPoint = hourlyData.properties.periods[periodBeingProcessed].dewPoint || "";

                    cell.addClass(tempClass).addClass(dayAndHour).addClass("number_" + hourlyData.properties.periods[periodBeingProcessed].number);
                    row.append(cell);
                    if (lastWindSpeedAndDirection !== windSpeed + windDirection) {
                        cell.append("<span>" + temp + "</span><br><i class='" + forecastClass + "'></i>" +
                            "<br /><span>" + probabilityOfPrecipitation + "</span>" +
                            "<br /><span class='amountofrain'>" + amountOfRain + "</span><span class='wind'>" + windSpeed + "<i class='fas fa-arrow-up " + windDirection + "'></i></span>" +
                            "<span class='dewpoint'>" + dewPoint + "</span>");
                        lastWindSpeedAndDirection = windSpeed + windDirection
                    } else {
                        cell.append("<span>" + temp + "</span><br><i class='" + forecastClass + "'></i>" +
                            "<br /><span>" + probabilityOfPrecipitation + "</span>" +
                            "<br /><span class='amountofrain'>" + amountOfRain + "</span><span class='wind'><i class='empty'></i></span>" +
                            "<span class='dewpoint'>" + dewPoint + "</span>");
                    }
                } else {
                    cell.addClass("empty")
                    cell.append("<span></span><br><i class=''></i><br><span class='probnumber'></span>");
                    row.append(cell);
                }
                currentTimeBeingProccessed.add(1, 'hour');
                if (startedProcessingData) {
                    periodBeingProcessed++;
                }
            }
        }
    }
}

var setUpEventListeners = function () {

    var self = this;

    $("#zipcode").click(function () {
        var newZip = prompt("what zip code?");
        setLocalStorageItem("zip", newZip);
        if (getGeoPointsForZipCode(newZip)) {
            window.location.href = window.location.href.replace(self.zipCode.toString(), newZip);
        } else {
            alert("That was not a zip code, dummy face.")
        }
    });
}

var setUpVariables = function () {
    this.zipCode = getGeoPointsForZipCode(urlParams.get("zip")) ? urlParams.get("zip") : getLocalStorageItem("zip");
}

var validateUrl = function () {

    this.urlParams = new URLSearchParams(window.location.search);

    if (!getGeoPointsForZipCode(urlParams.get("zip"))) {

        var zipCode;

        if (getGeoPointsForZipCode(getLocalStorageItem("zip"))){
            zipCode = getLocalStorageItem("zip");
        } else {
            zipCode = prompt("what zip code?");
            if (!getGeoPointsForZipCode(zipCode)) {
                alert("Oops, somethng went wrong. Setting zip code to Beverly Hills");
                zipCode = "90210"
            }
        }

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
}

addLoadEvent(initialize);