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

var getIndexedDbConnection = function (onSuccess, onError) {

    var request;

    if (!window.indexedDB) {
        if (onError) {
            onError();
        }
        return;
    }

    request = window.indexedDB.open("weather", 1);

    request.onupgradeneeded = function (event) {
        var db = event.target.result;

        if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings");
        }
    };

    request.onsuccess = function (event) {
        onSuccess(event.target.result);
    };

    request.onerror = function () {
        if (onError) {
            onError();
        }
    };
}

var setIndexedDbItem = function (key, value, onComplete) {

    getIndexedDbConnection(function (db) {
        var transaction = db.transaction(["settings"], "readwrite");
        var objectStore = transaction.objectStore("settings");

        objectStore.put(value, key);

        transaction.oncomplete = function () {
            db.close();
            if (onComplete) {
                onComplete(true);
            }
        };

        transaction.onerror = function () {
            db.close();
            if (onComplete) {
                onComplete(false);
            }
        };
    }, function () {
        if (onComplete) {
            onComplete(false);
        }
    });
}

var getIndexedDbItem = function (key, onComplete) {

    getIndexedDbConnection(function (db) {
        var transaction = db.transaction(["settings"], "readonly");
        var objectStore = transaction.objectStore("settings");
        var request = objectStore.get(key);

        request.onsuccess = function () {
            db.close();
            onComplete(request.result);
        };

        request.onerror = function () {
            db.close();
            onComplete(undefined);
        };
    }, function () {
        onComplete(undefined);
    });
}