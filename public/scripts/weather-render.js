var getPeriodIndexByStartTime = function (hourlyData) {

    var periodIndexByStartTime = {};

    hourlyData.properties.periods.forEach(function (period, index) {
        periodIndexByStartTime[moment(period.startTime).toISOString()] = index;
    });

    return periodIndexByStartTime;
}

var populateAmountofRainIntoHourlyData = function (gridData, hourlyData, periodIndexByStartTime) {

    var amountInInches;
    var firstPeriodIndex;
    var numberOfHours;
    var periods = hourlyData.properties.periods;
    var time;
    var timeSpan;
    var timeUnit;
    var timeUnitCount;

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

        firstPeriodIndex = periodIndexByStartTime[moment(time).toISOString()];

        amountInInches = parseFloat(amountOfRain.value) / 25.4;

        if (firstPeriodIndex !== undefined && amountInInches >= 0) {
            amountInInches = Math.round(amountInInches * 10) / 10;
            if (amountInInches >= 0 && amountInInches < 0.1) {
                amountInInches = 0.1;
            }
            periods[firstPeriodIndex].amountOfRain = amountInInches.toFixed(1) + "\" >";
            for (var i = 0; i < numberOfHours - 1; i++) {
                if (periods[firstPeriodIndex + i + 1] !== undefined) {
                    if (i + 2 === parseInt(numberOfHours)) {
                        periods[firstPeriodIndex + i + 1].amountOfRain = "-> |";
                    } else {
                        periods[firstPeriodIndex + i + 1].amountOfRain = "->";
                    }
                }
            }
        }
    });    
}

var populateChanceOfRainIntoHourlyData = function (gridData, hourlyData, periodIndexByStartTime) {

    var firstPeriodIndex;
    var loopCounter;
    var periods = hourlyData.properties.periods;
    var time;
    var timeSpan;
    var timeUnit;
    var timeUnitCount;

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

        firstPeriodIndex = periodIndexByStartTime[moment(time).toISOString()];

        if (firstPeriodIndex !== undefined) {
            for (var i = 0; i < loopCounter; i++) {
                if (periods[firstPeriodIndex + i] !== undefined) {
                    periods[firstPeriodIndex + i].probabilityOfPrecipitation = chanceOfRain.value;
                }
            }
        }
    });
}

var populateHumidityIntoHourlyData = function (gridData, hourlyData, periodIndexByStartTime) {

    var firstPeriodIndex;
    var loopCounter;
    var periods = hourlyData.properties.periods;
    var time;
    var timeSpan;
    var timeUnit;
    var timeUnitCount;

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

        firstPeriodIndex = periodIndexByStartTime[moment(time).toISOString()];

        if (firstPeriodIndex !== undefined) {
            for (var i = 0; i < loopCounter; i++) {
                if (periods[firstPeriodIndex + i] !== undefined) {
                    periods[firstPeriodIndex + i].dewPoint = parseInt((dewPoint.value * 9 / 5) + 32);
                    if (periods[firstPeriodIndex + i].dewPoint < 63) {
                        periods[firstPeriodIndex + i].dewPoint = "nice"
                    } else if (periods[firstPeriodIndex + i].dewPoint < 71) {
                        periods[firstPeriodIndex + i].dewPoint = "blah"
                    } else {
                        periods[firstPeriodIndex + i].dewPoint = "gross"
                    }
                }
            }
        }
    });
}

var renderPlaceHolderTable = function () {

    var cell;
    var currentTimeBeingProccessed;
    var dayAndHour;
    var dayName;
    var dayNameLowerCase;
    var forecastClass;
    var rows;
    var row;
    var tableBody;
    var tempClass;

    currentTimeBeingProccessed = new moment().startOf('day');
    rows = [];
    tableBody = $("#weathertable");

    for (var i = 0; i < 5; i++) {

        dayName = currentTimeBeingProccessed.format('ddd');
        dayNameLowerCase = dayName.toLowerCase();
        row = $(document.createElement("tr")).addClass(dayNameLowerCase);

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

        rows.push(row);
    }

    tableBody.append(rows);

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
    var rows;
    var row;
    var startedProcessingData;
    var tableBody;
    var temp;
    var tempClass;
    var windDirection;
    var windSpeed;

    startedProcessingData = false;
    periodBeingProcessed = 0;
    currentTimeBeingProccessed = new moment().startOf('day');
    lastWindSpeedAndDirection = "";
    rows = [];
    tableBody = $("#weathertable");

    tableBody.html("");

    while (new moment(hourlyData.properties.periods[periodBeingProcessed].startTime).toISOString() < currentTimeBeingProccessed.toISOString()){
        periodBeingProcessed++;
    }
    
    for (var i = 0; i < 5; i++) {

        dayName = currentTimeBeingProccessed.format('ddd');
        dayNameLowerCase = dayName.toLowerCase();
        row = $(document.createElement("tr")).addClass(dayNameLowerCase);        
    
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

        rows.push(row);
    }

    tableBody.append(rows);
}
