/*
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @author Raquel Díaz González
 */

kurento_room.controller('callController', function ($scope, $window, ServiceParticipant, ServiceRoom, LxNotificationService) {
    window.isFullScreen = false;

    window.setFullScreenStatus = function(status)
    {
        window.isFullScreen = status;
    }
    $scope.topic = ServiceRoom.getTopic();
    $scope.userName = ServiceRoom.getUserName();
    $scope.participants = ServiceParticipant.getParticipants();
    $scope.kurento = ServiceRoom.getKurento();
    $scope.roomName = ServiceRoom.getRoomName();
    $scope.plat = ServiceRoom.getPlat();

    $scope.leaveRoom = function () {

        ServiceRoom.getKurento().close();

        ServiceParticipant.removeParticipants();

        //redirect to login
        //$window.location.href = '#/login';
        if(CLIENT_API==null){
            if($scope.plat==2){
                 window.location.href="qim://close";
             }else{
                 window.location.href="#/call?status=hangup";
            }
        }else{
            CLIENT_API.close_video_room($scope.roomName);
        }
    };

    window.closePeerConn = function(){
        ServiceRoom.getKurento().close();

        ServiceParticipant.removeParticipants();
    };

    window.onbeforeunload = function () {
    	//not necessary if not connected
    	if (ServiceParticipant.isConnected()) {
    		ServiceRoom.getKurento().close();
    	}
    };

    $scope.shareScreen = function(){
        var localStream = ServiceParticipant.getLocalParticipant().getStream();
        var element = document.getElementById("buttonShareScreen");
        if (element.classList.contains("md-desktop-mac")) { //on
            element.classList.remove("md-desktop-mac");
            element.classList.add("md-person");
            localStream.initShareDesktop();
        } else { //off
            element.classList.remove("md-person");
            element.classList.add("md-desktop-mac");
            localStream.backtoperson();
        }
    }

    function fullScreen(){
        var el = document.documentElement;
        var rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

        if (rfs) {
            rfs.call(el);
        }
        else if (typeof window.ActiveXObject !== "undefined") {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript != null) {
                wscript.SendKeys("{F11}");
            }
        }
    }

    function exitScreen(){
        var el = document;
        var cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen;

        if (cfs) {
            cfs.call(el);
        }
        else if (typeof window.ActiveXObject !== "undefined") {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript != null) {
                wscript.SendKeys("{F11}");
            }
        }
    }

    $scope.goFullscreen = function () {
        /*if(window.isFullScreen)
        {
            window.CLIENT_API.cancelFullScreen($scope.roomName);
        }
        else{
            window.CLIENT_API.enableFullScreen($scope.roomName);
        }*/
        //全屏
        $scope.goFullscreen = function () {
            if(window.isFullScreen)
            {
                window.setFullScreenStatus(false);
                exitScreen();
            }
            else{
                window.setFullScreenStatus(true);
                fullScreen();
            }
        };
    };
    
    $scope.disableMainSpeaker = function (value) {

    	var element = document.getElementById("buttonMainSpeaker");
        if (element.classList.contains("md-person")) { //on
            element.classList.remove("md-person");
            element.classList.add("md-recent-actors");
            ServiceParticipant.enableMainSpeaker();
        } else { //off
            element.classList.remove("md-recent-actors");
            element.classList.add("md-person");
            ServiceParticipant.disableMainSpeaker();
        }
    }

    $scope.onOffVolume = function () {
        var localStream = ServiceRoom.getLocalStream();
        var element = document.getElementById("buttonVolume");
        if (element.classList.contains("md-volume-off")) { //on
            element.classList.remove("md-volume-off");
            element.classList.add("md-volume-up");
            localStream.audioEnabled = true;
        } else { //off
            element.classList.remove("md-volume-up");
            element.classList.add("md-volume-off");
            localStream.audioEnabled = false;
        }
    };

    $scope.onOffVideocam = function () {
        var localStream = ServiceRoom.getLocalStream();
        var element = document.getElementById("buttonVideocam");
        if (element.classList.contains("md-videocam-off")) {//on
            element.classList.remove("md-videocam-off");
            element.classList.add("md-videocam");
            localStream.videoEnabled = true;
        } else {//off
            element.classList.remove("md-videocam");
            element.classList.add("md-videocam-off");
            localStream.videoEnabled = false;
        }
    };
});


