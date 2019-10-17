

kurento_room.controller('loginController', function ($scope, $http, ServiceParticipant, $window, ServiceRoom, LxNotificationService) {

    var options;
    var inputCkey;
    var topic;
    var userName;
    var roomName;
    var startTime;
    var plat;
    //var pathInfo = location.pathname;
    //项目或NG转发前缀路径
    var pathInfo = location.pathname;
    if(pathInfo.endsWith("conference")){
        pathInfo = pathInfo.substring(0,pathInfo.length-"conference".length);
    }
    COOKIE_PARAMETER={};
    console.log(pathInfo);
    $scope.initRoom = function(params) {

        if (!params)
            ServiceParticipant.showError($window, LxNotificationService, {
                error: {
                    message:"Username and room fields are both required"
                }
            });

        var wsUri = 'wss://' + location.host+pathInfo+ 'room';
        console.log(wsUri);

        //show loopback stream from server
        var displayPublished = $scope.clientConfig.loopbackRemote || false;
        //also show local stream when display my remote
        var mirrorLocal = $scope.clientConfig.loopbackAndLocal || false;

        var kurento = KurentoRoom(wsUri, function (error, kurento) {

            if (error)
                return console.log(error);


            kurento.setRpcParams({ckey:inputCkey});

            var room = kurento.Room({
                room: params.roomName,
                topic:params.roomTopic,
                user: params.userName,
                startTime:params.startTime,
                plat:params.plat,
                updateSpeakerInterval: $scope.updateSpeakerInterval,
                thresholdSpeaker: $scope.thresholdSpeaker,
                configuration:{iceServers:params.iceServers}
            });

            var localStream = kurento.Stream(room, {
                audio: true,
                video: true,
                data: false,
                configuration:{iceServers:params.iceServers}
            });

            localStream.addEventListener("access-accepted", function () {
                room.addEventListener("room-connected", function (roomEvent) {
                    var streams = roomEvent.streams;
                    if (displayPublished ) {
                        localStream.subscribeToMyRemote();
                    }
                    localStream.publish();
                    ServiceRoom.setLocalStream(localStream.getWebRtcPeer());
                    for (var i = 0; i < streams.length; i++) {
                        ServiceParticipant.addParticipant(streams[i]);
                    }
                });

                room.addEventListener("stream-published", function (streamEvent) {
                    ServiceParticipant.addLocalParticipant(localStream);
                    if (mirrorLocal && localStream.displayMyRemote()) {
                        var localVideo = kurento.Stream(room, {
                            video: true,
                            id: "localStream"
                        });
                        localVideo.mirrorLocalStream(localStream.getWrStream());
                        ServiceParticipant.addLocalMirror(localVideo);
                    }
                });

                room.addEventListener("stream-added", function (streamEvent) {
                    ServiceParticipant.addParticipant(streamEvent.stream);
                });

                room.addEventListener("stream-removed", function (streamEvent) {
                    ServiceParticipant.removeParticipantByStream(streamEvent.stream);
                });

                room.addEventListener("newMessage", function (msg) {
                    ServiceParticipant.showMessage(msg.room, msg.user, msg.message);
                });

                room.addEventListener("error-room", function (error) {
                    ServiceParticipant.showError($window, LxNotificationService, error);
                });

                room.addEventListener("error-media", function (msg) {
                    ServiceParticipant.alertMediaError($window, LxNotificationService,params.roomName, msg.error, function (answer) {
                        console.warn("Leave room because of error: " + answer);
                        if (answer) {
                            kurento.close(true);
                        }
                    });
                });

                room.addEventListener("room-closed", function (msg) {
                    if (msg.room !== params.roomName) {
                        console.error("Closed room name doesn't match this room's name",
                            msg.room, params.roomName);
                    } else {
                        kurento.close(true);
                        ServiceParticipant.forceClose($window, LxNotificationService, 'Room '
                            + msg.room + ' has been forcibly closed from server',params.roomName);
                    }
                });

                room.addEventListener("lost-connection", function(msg) {
                    kurento.close(true);
                    ServiceParticipant.forceClose($window, LxNotificationService,
                        'Lost connection with room "' + msg.room +
                        '". Please try reloading the webpage...',params.roomName);
                });

                room.addEventListener("stream-stopped-speaking", function (participantId) {
                    ServiceParticipant.streamStoppedSpeaking(participantId);
                });

                room.addEventListener("stream-speaking", function (participantId) {
                    ServiceParticipant.streamSpeaking(participantId);
                });

                room.addEventListener("update-main-speaker", function (participantId) {
                    ServiceParticipant.updateMainSpeaker(participantId);
                });

                room.connect();
            });

            localStream.addEventListener("access-denied", function () {
                ServiceParticipant.showError($window, LxNotificationService, {
                    error : {
                        message : "Access not granted to camera and microphone"
                    }
                });
            });
            localStream.init();
        });

        //save kurento & roomName & userName in service
        ServiceRoom.setKurento(kurento);
        ServiceRoom.setRoomName(params.roomName);
        ServiceRoom.setTopic(params.roomTopic);
        ServiceRoom.setUserName(params.userName);
        ServiceRoom.setPlat(params.plat);

        //redirect to call
        $window.location.href = '#/call';
    };



    $scope.joinConference = function()
    {
        var roomParams = {};
        roomParams.mucName = roomName.split("@")[0];
        roomParams.domain = roomName.split("@")[1];
        roomParams.username = userName.split("@")[0];
        roomParams.host = userName.split("@")[1];
        roomParams.ckey = inputCkey;
        if(!isNotEmpty(roomParams.domain)){
            roomParams.domain = "conference.ejabhost1";
        }
        if(!isNotEmpty(roomParams.host)){
            roomParams.host = "ejabhost1";
        }
        $http.get((pathInfo+'getTurnServers?username='+inputCkey)).
        success(function(data,status,headers,config){
            if(data.ret)
            {
                var room = {};
                room.iceServers = data.servers;
                room.roomName = roomName;
                room.roomTopic = topic;
                room.userName = data.userId;
                room.startTime = startTime;
                room.plat = plat;
                $scope.initRoom(room);
            }
            else{
                var error;
                if(data.message) error = data.message;
                else error = "error!";
                ServiceParticipant.forceClose($window, LxNotificationService,
                    error,roomName);
            }
        }).error(function(data,status,headers,config){
            var error;
            if(data.message) error = data.message;
            else error = "error!";
            ServiceParticipant.forceClose($window, LxNotificationService,
                error,roomName);
        });
    };
    $window.sgsetTopic = function(val){
        console.log("SETTING TOPIC:" + val);
        topic = val;
        $scope.topic = val;
        console.log("TOPIC SET:" + topic);
    };
    $window.sgsetUserId = function(userId){
        userName = userId;
    };

    $window.sgsetRoomID = function(roomId)
    {
        roomName = roomId;
    };

    $window.sgsetStartTime = function(st)
    {
        startTime = st;
    };

    $window.sgsetNickByUserId = function(jid,nick){
        var name = document.getElementById("name-"+jid);
        if(name) name.innerText=nick;
    }

    $window.sgsetCkey = function(k){
        inputCkey = k;
        $scope.joinConference();
    };
    $window.sgsetMyNick = function(nick)
    {
        $scope.nick = nick;
    }

    $window.sgsetMyNick = function(nick)
    {
        $scope.nick = nick;
    }
    $window.sgsetPlat = function(plat)
    {
        $scope.plat = plat;
    }

    if(CLIENT_API==null){

        var cKey = getCookie("q_ckey");
        if(!isNotEmpty(cKey)) cKey = GetQueryString("cKey");
        if(!isNotEmpty(cKey)) cKey = GetQueryString("ckey");
        if(!isNotEmpty(cKey)) cKey = getCookie("cKey");
        if(!isNotEmpty(cKey)) cKey = getCookie("ckey");

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

        sgsetStartTime( COOKIE_PARAMETER.startTime);
        sgsetTopic(COOKIE_PARAMETER.topic);
        sgsetUserId(COOKIE_PARAMETER.userId);
        sgsetRoomID( COOKIE_PARAMETER.roomId);
        sgsetMyNick(COOKIE_PARAMETER.nick);
        sgsetPlat(COOKIE_PARAMETER.plat);

    }else{
        CLIENT_API.getStartTime();
        CLIENT_API.getTopic();
        CLIENT_API.getUserId();
        CLIENT_API.getRoomID();
        CLIENT_API.getMyNick();
    }



    $scope.getThresholdSpeaker = function(){
        $http.get(pathInfo+'getThresholdSpeaker').
        success(function (data, status, headers, config) {
            $scope.thresholdSpeaker = data;
            if(CLIENT_API==null){
                sgsetCkey(COOKIE_PARAMETER.cKey);
            }else{
                CLIENT_API.getCkey();
            }
        }).
        error(function (data, status, headers, config) {
        });
    };
    $scope.getUpdateSpeakerInterval = function(){
        $http.get(pathInfo+'getUpdateSpeakerInterval').
        success(function (data, status, headers, config) {
            $scope.updateSpeakerInterval = data
            $scope.getThresholdSpeaker();
        }).
        error(function (data, status, headers, config) {
        });
    };
    $http.get(pathInfo+'getClientConfig').
    success(function (data, status, headers, config) {
        //console.log(JSON.stringify(data));
        $scope.clientConfig = data;
        $scope.getUpdateSpeakerInterval();
    }).
    error(function (data, status, headers, config) {
    });
});


