/*
 * @author Raquel Díaz González
 */

kurento_room.service('ServiceRoom', function () {

    var kurento;
    var roomName;
    var userName;
    var localStream;
    var topic;
    var plat;

    this.getTopic = function () {
        return topic;
    };

    this.setTopic = function (value) {
        topic = value;
    };

    this.getKurento = function () {
        return kurento;
    };

    this.getRoomName = function () {
        return roomName;
    };

    this.setKurento = function (value) {
        kurento = value;
    };

    this.setRoomName = function (value) {
        roomName = value;
    };

    this.getLocalStream = function () {
        return localStream;
    };

    this.setLocalStream = function (value) {
        localStream = value;
    };

    this.getUserName = function () {
        return userName;
    };

    this.setUserName = function (value) {
        userName = value;
    };
    this.getPlat = function () {
        return plat;
    };

    this.setPlat = function (value) {
        plat = value;
    };
});
