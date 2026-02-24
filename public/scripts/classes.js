getForecastClasses = function (info) {

    var forecast = info.icon.split("/")[info.icon.split("/").length - 1].split("?")[0].split(',')[0];
    var isDay = info.isDaytime;
    var temp = info.temperature;

    switch (forecast) {
        case "skc":
        case "few":
        case "hot":
            forecastClass = isDay ? "fas fa-sun" : "far fa-moon";
            break;
        case "sct":
        case "bkn":
            forecastClass = isDay ? "fas fa-cloud-sun" : "fas fa-cloud-moon";
            break;
        case "rain":
        case "rain_showers":
        case "rain_showers_hi":
            forecastClass = "fas fa-cloud-rain";
            break;
        case "rain_snow":
        case "rain_sleet":
        case "rain_fzra":
        case "snow_fzra":
        case "fzra":
        case "snow":
            forecastClass = parseInt(temp) > 32 ? "fas fa-cloud-rain" : "far fa-snowflake";
            break;
        case "tsra":
        case "tsra_sct":
        case "tsra_hi":
            forecastClass = "fas fa-bolt";
            break;
        case "cold":
            forecastClass = "fas fa-icicles";
            break;
        case "ovc":
            forecastClass = "fas fa-cloud";
            break;
        case "wind_bkn":
        case "wind_few":
        case "wind_ovc":
        case "wind_sct":
        case "wind_skc":
            forecastClass = "fas fa-wind";
            break;
        case "haze":
        case "fog":
            forecastClass = "fas fa-smog";
            break;
        default:
            forecastClass = "fas fa-question";
            console.log(forecast);
            break;
    }

    return forecastClass;
}