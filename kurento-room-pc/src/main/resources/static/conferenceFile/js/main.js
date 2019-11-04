var CLIENT_API = null;
var COOKIE_PARAMETER = {};
var kurento_room = angular.module('kurento_room', ['ngRoute', 'FBAngular', 'lumx']);

kurento_room.config(function ($routeProvider) {

    $routeProvider
        .when('/login', {
            templateUrl: 'conferenceFile/angular/login/login.html',
            controller: 'loginController'
        })
        .when('/call', {
            templateUrl: 'conferenceFile/angular/call/call.html',
            controller: 'callController'
        });
});
var getCookie = function (name) {
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg))
        return decodeURIComponent(arr[2]);
    else
        return null;
}

function isNotEmpty(obj) {
    if (typeof obj != "undefined" && obj != null && obj != "") {
        return true;
    } else {
        return false;
    }
}

function GetQueryString(variable) {
    var uri = window.location.hash.substr(8);
    var vars = uri.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return null;
}

var cKey = getCookie("q_ckey");
if (!isNotEmpty(cKey)) cKey = GetQueryString("cKey");
if (!isNotEmpty(cKey)) cKey = GetQueryString("ckey");
if (!isNotEmpty(cKey)) cKey = getCookie("cKey");
if (!isNotEmpty(cKey)) cKey = getCookie("ckey");

var userId = GetQueryString("userId");
var roomId = GetQueryString("roomId");
var topic = decodeURIComponent(GetQueryString("topic"));
var startTime = new Date().getTime();
var plat = GetQueryString("plat");

if (isNotEmpty(topic) && isNotEmpty(userId) && isNotEmpty(roomId) && isNotEmpty(cKey)) {
    COOKIE_PARAMETER = {};
    COOKIE_PARAMETER.startTime = startTime;
    COOKIE_PARAMETER.topic = topic;
    COOKIE_PARAMETER.userId = userId;
    COOKIE_PARAMETER.roomId = roomId;
    COOKIE_PARAMETER.cKey = cKey;
    COOKIE_PARAMETER.plat = plat;
}
window.onload = function () {

    var cKey = getCookie("q_ckey");
    if (!isNotEmpty(cKey)) cKey = GetQueryString("cKey");
    if (!isNotEmpty(cKey)) cKey = GetQueryString("ckey");
    if (!isNotEmpty(cKey)) cKey = getCookie("cKey");
    if (!isNotEmpty(cKey)) cKey = getCookie("ckey");

    var userId = GetQueryString("userId");
    var roomId = GetQueryString("roomId");
    var topic = decodeURIComponent(GetQueryString("topic"));
    var startTime = new Date().getTime();
    var plat = GetQueryString("plat");

    COOKIE_PARAMETER.startTime = startTime;
    COOKIE_PARAMETER.topic = topic;
    COOKIE_PARAMETER.userId = userId;
    COOKIE_PARAMETER.roomId = roomId;
    COOKIE_PARAMETER.cKey = cKey;
    COOKIE_PARAMETER.plat = plat;
    if (isNotEmpty(COOKIE_PARAMETER.topic) && isNotEmpty(COOKIE_PARAMETER.userId) && isNotEmpty(COOKIE_PARAMETER.roomId) && isNotEmpty(COOKIE_PARAMETER.cKey)) {
    } else {
        window.qtChannel = new QWebChannel(qt.webChannelTransport, function (channel) {
            var clientapi = channel.objects.client;
            CLIENT_API = clientapi;
        });
    }

}
window.qtReady = function () {
    window.location.href = '#/login';
}
