$(document).ready(function () {
    $(".focus").focus();
    window.scrollTo(0, getCookie("currentScrollPosition"));
});

window.onscroll = function () {
    setCookie("currentScrollPosition", window.pageYOffset, window.location.pathname, 5)
};

var getCookie = function (cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
};

var setCookie = function (name, value, path, expirationInMinutes) {
    var date = new Date();
    date.setTime(date.getTime() + (expirationInMinutes * 1000 * 60));
    document.cookie = name + "=" + value + ";expires=" + date.toUTCString() + ";path=" + path;
}

var setLocalStorageItem = function (key, value, expiration) {
    window.localStorage.setItem(key, value);
}

var getLocalStorageItem = function (key) {
    return window.localStorage.getItem(key);
}