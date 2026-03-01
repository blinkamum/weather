var getPeriodIndexByStartTime = function (hourlyData) {

    var periodIndexByStartTime = {};

    hourlyData.properties.periods.forEach(function (period, index) {
        periodIndexByStartTime[moment(period.startTime).toISOString()] = index;
    });

    return periodIndexByStartTime;
}

var getDurationHoursFromValidTime = function (validTime) {

    var durationToken;
    var durationInHours;
    var weeksMatch;
    var daysMatch;
    var hoursMatch;
    var minutesMatch;
    var secondsMatch;
    var weeks;
    var days;
    var hours;
    var minutes;
    var seconds;

    durationToken = validTime && validTime.indexOf("/") > -1 ? validTime.split("/")[1] : "PT1H";
    durationInHours = moment.duration(durationToken).asHours();

    if (!isNaN(durationInHours) && durationInHours > 0) {
        return Math.ceil(durationInHours);
    }

    weeksMatch = durationToken.match(/(\d+)W/);
    daysMatch = durationToken.match(/(\d+)D/);
    hoursMatch = durationToken.match(/T.*?(\d+)H/);
    minutesMatch = durationToken.match(/T.*?(\d+)M/);
    secondsMatch = durationToken.match(/T.*?(\d+)S/);

    weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 0;
    days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
    hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

    durationInHours = (weeks * 7 * 24) + (days * 24) + hours + (minutes / 60) + (seconds / 3600);

    return durationInHours > 0 ? Math.ceil(durationInHours) : 1;
}

var isAmountOfRainTooltipInteractionsInitialized = false;
var amountOfRainTooltipHideTimer;

var initializeAmountOfRainTooltipInteractions = function () {

    if (isAmountOfRainTooltipInteractionsInitialized) {
        return;
    }

    isAmountOfRainTooltipInteractionsInitialized = true;

    $(document).on("click.amountOfRainTooltip", ".amountofrain[data-tooltip]", function (event) {
        var target = $(this);

        event.stopPropagation();

        if (amountOfRainTooltipHideTimer) {
            clearTimeout(amountOfRainTooltipHideTimer);
        }

        $(".amountofrain.show-tooltip").not(target).removeClass("show-tooltip");
        target.toggleClass("show-tooltip");

        if (target.hasClass("show-tooltip")) {
            amountOfRainTooltipHideTimer = setTimeout(function () {
                target.removeClass("show-tooltip");
            }, 2600);
        }
    });

    $(document).on("keydown.amountOfRainTooltip", ".amountofrain[data-tooltip]", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            $(this).trigger("click");
        }
    });

    $(document).on("click.amountOfRainTooltipDismiss", function (event) {
        if ($(event.target).closest(".amountofrain[data-tooltip]").length === 0) {
            $(".amountofrain.show-tooltip").removeClass("show-tooltip");
        }
    });
}

var populateAmountofRainIntoHourlyData = function (gridData, hourlyData, periodIndexByStartTime) {

    var amountInInches;
    var firstPeriodIndex;
    var numberOfHours;
    var periods = hourlyData.properties.periods;
    var time;

    gridData.properties.quantitativePrecipitation.values.forEach(function (amountOfRain) {

        time = amountOfRain.validTime.split("/")[0];
        numberOfHours = getDurationHoursFromValidTime(amountOfRain.validTime);

        firstPeriodIndex = periodIndexByStartTime[moment(time).toISOString()];

        amountInInches = parseFloat(amountOfRain.value) / 25.4;

        if (firstPeriodIndex !== undefined && amountInInches >= 0) {
            amountInInches = Math.round(amountInInches * 10) / 10;

            if (amountInInches === 0) {
                return;
            }

            if (amountInInches > 0 && amountInInches < 0.1) {
                amountInInches = 0.1;
            }
            periods[firstPeriodIndex].amountOfRain = amountInInches.toFixed(1) + "\" >";
            periods[firstPeriodIndex].amountOfRainDurationHours = numberOfHours;
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

    gridData.properties.probabilityOfPrecipitation.values.forEach(function (chanceOfRain) {

        time = chanceOfRain.validTime.split("/")[0];
        loopCounter = getDurationHoursFromValidTime(chanceOfRain.validTime);

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

    gridData.properties.dewpoint.values.forEach(function (dewPoint) {

        time = dewPoint.validTime.split("/")[0];
        loopCounter = getDurationHoursFromValidTime(dewPoint.validTime);

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

var getForecastMidnight = function (hourlyData) {

    var periods;
    var forecastOffset;

    periods = hourlyData && hourlyData.properties ? hourlyData.properties.periods : undefined;

    if (!periods || !periods.length || !periods[0].startTime) {
        return new moment().startOf('day');
    }

    forecastOffset = moment.parseZone(periods[0].startTime).format("Z");

    return new moment().utcOffset(forecastOffset).startOf('day');
}

var renderForecastMeta = function (hourlyData, gridData) {

    var forecastMetaElement;
    var periods;
    var firstPeriod;
    var lastPeriod;
    var forecastOffset;
    var updateTime;
    var validRange;
    var validRangeText;
    var lastUpdatedText;
    var lastUpdatedRelativeText;

    forecastMetaElement = $("#forecastMeta");

    if (!forecastMetaElement.length) {
        return;
    }

    periods = hourlyData && hourlyData.properties ? hourlyData.properties.periods : undefined;

    if (!periods || !periods.length) {
        forecastMetaElement.text("");
        return;
    }

    firstPeriod = periods[0];
    lastPeriod = periods[periods.length - 1];
    forecastOffset = firstPeriod.startTime ? moment.parseZone(firstPeriod.startTime).format("Z") : moment().format("Z");

    updateTime = hourlyData && hourlyData.properties ? hourlyData.properties.updateTime || hourlyData.properties.generatedAt : undefined;
    validRange = firstPeriod.startTime && lastPeriod.endTime
        ? firstPeriod.startTime + "/" + lastPeriod.endTime
        : (gridData && gridData.properties ? gridData.properties.validTimes : undefined);

    lastUpdatedText = updateTime
        ? moment.parseZone(updateTime).utcOffset(forecastOffset).format("ddd M/D h:mm A")
        : "unknown";

    lastUpdatedRelativeText = updateTime
        ? moment.parseZone(updateTime).fromNow()
        : "unknown";

    if (validRange && validRange.indexOf("/") > -1) {
        validRangeText = moment.parseZone(validRange.split("/")[0]).utcOffset(forecastOffset).format("ddd M/D h:mm A") +
            " to " +
            moment.parseZone(validRange.split("/")[1]).utcOffset(forecastOffset).format("ddd M/D h:mm A");
    } else {
        validRangeText = "unknown";
    }

    forecastMetaElement.text("Forecast updated " + lastUpdatedText + " (" + lastUpdatedRelativeText + ") | valid " + validRangeText + " (UTC" + forecastOffset + ")");
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
    var amountOfRainTooltipAttributes;
    var amountOfRainDurationHours;
    var windDirection;
    var windSpeed;

    initializeAmountOfRainTooltipInteractions();

    startedProcessingData = false;
    periodBeingProcessed = 0;
    currentTimeBeingProccessed = getForecastMidnight(hourlyData);
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
                    amountOfRainDurationHours = hourlyData.properties.periods[periodBeingProcessed].amountOfRainDurationHours;
                    amountOfRainTooltipAttributes = amountOfRainDurationHours === undefined
                        ? ""
                        : " tabindex='0' role='button' aria-label='Total precipitation for the next " + amountOfRainDurationHours + " hour" + (amountOfRainDurationHours === 1 ? "" : "s") + ".' data-tooltip='Total precipitation for the next " + amountOfRainDurationHours + " hour" + (amountOfRainDurationHours === 1 ? "" : "s") + ".'";
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
                            "<br /><span class='amountofrain'" + amountOfRainTooltipAttributes + ">" + amountOfRain + "</span><span class='wind'>" + windSpeed + "<i class='fas fa-arrow-up " + windDirection + "'></i></span>" +
                            "<span class='dewpoint'>" + dewPoint + "</span>");
                        lastWindSpeedAndDirection = windSpeed + windDirection
                    } else {
                        cell.append("<span>" + temp + "</span><br><i class='" + forecastClass + "'></i>" +
                            "<br /><span>" + probabilityOfPrecipitation + "</span>" +
                            "<br /><span class='amountofrain'" + amountOfRainTooltipAttributes + ">" + amountOfRain + "</span><span class='wind'><i class='empty'></i></span>" +
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
