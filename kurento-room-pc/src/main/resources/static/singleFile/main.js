/**
 * Created by xinbo.wang on 2017-02-13.
 */
'use strict';

var CLIENT_API;
var btn_wrapper = document.getElementById("btn_wrapper");
var localVideo = document.getElementById("local");
var remoteVideo = document.getElementById("remote");
var caller = false;
var peerConn;
var enableVideo = true;

var config;
var toJid;
var localStream;
var isCaller = true;
var isConnect = false;
var startTime;
var endTime;
var autoCloseTime = 15000;
var cameraTotal = 0;

var parameters={};

var candidates=[];
var DEBUG = false;
var callerUserInfo={};
var isAccept = false;
var clientVersion =null;

window.onload=function () {
    if ("undefined" != typeof qt){
    new QWebChannel(qt.webChannelTransport,function (channel) {
        CLIENT_API = channel.objects.client;
    });
    logUtil=writeLog;
   } else {
     CLIENT_API = CLIENT_API_inner;
   }

    $('video').click(function(event) {
        if (!isAccept) return;
        if ($(event.target).hasClass('normal')) {
            $('video').removeClass('actived').addClass('normal')
            $(this).addClass('actived').removeClass('normal')
        }
    });
    autoShowCameraBtn();
    clientVersion = getQueryVariable("ver");
    if(clientVersion !== "new"){
        $(".page").hide();
        $("body").html("<h1><center>客户端版本过低，实时视频无法接通</center></h1>");
    }

};

function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

function sgsetCkey(clientQckey){
    callerUserInfo.qckey = clientQckey;
}
function sgsetUserInfo(userId,nick,headPhoto){
    callerUserInfo.userId = userId;
    callerUserInfo.nick = nick;
    callerUserInfo.headPhoto = headPhoto;
    $('#invite_profile').css('background-image', "url(\'"+headPhoto+"\')");
    $('#invite_profile_img').attr('src', headPhoto);
    $("#bg_blur").css('background-image', "url(\'"+headPhoto+"\')");

}
function receiveRtc(json,jid){
    console.log("qt:receiveRtc:",json,",",jid);
    enableVideo = true;
    toJid = jid;
    playTone();
    initConfigs(json);
    initStream();
    btn_wrapper.className='btn-wrapper';
    $("#btn_video_mute").hide();
    $("#btn_audio_mute").hide();
    $("#btn_switch").hide();
    $("#btn_toggle_fullscreen").hide();
    $('.invite_text').text(callerUserInfo.nick+"邀请你视频通话...");

}



function receiveRtcAudio(json,jid) {
    console.log("qt:receiveRtcAudio:",json,",",jid);
    enableVideo = false;
    toJid=jid;
    playTone();
    initConfigs(json);
    initStream();
    // $("#invite_wrapper").hide();
    localVideo.style.visibility = "hidden";
    btn_wrapper.className='btn-wrapper';
    $("#btn_video_mute").hide();
    $("#btn_audio_mute").hide();
    $("#btn_switch").hide();
    $("#btn_toggle_fullscreen").hide();
    $('.invite_text').text(callerUserInfo.nick+"邀请你音频通话...");
}

function receiveSignal(data) {
    console.log(data);
    console.trace();
    var payload= JSON.parse(data);//eval("("+data+")");
    console.log(payload.type);
	switch (payload.type)
    {
        case "offer":
            stopTone();
	    writeLog('offer');
            onReceiveOffer(payload);
            break;
        case "answer":
            stopTone();
	    writeLog('answer');
            onReceiveAnswer(payload);
            break;
        case "candidate":
	    writeLog('candidate');
            onReceiveCandidate(payload);
            break;
        case "deny":
	    stopTone();
            onReceiveDeny(payload);
            break;
        case "close":
	    stopTone();
            onReceiveClose(payload);
            break;
        case "busy":
	    stopTone();
            onReceiveBusy(payload);
            break;
        case "cancel":
            stopTone();
            onReceiveClose(payload);
            break;
        case "timeout":
            stopTone();
            onReceiveClose(payload);
            break;
	default :
	    console.log("payload is default!");
    }
}

function initConfigs(json)
{
    console.log("qt:initConfigs:",json);
    var data= eval("("+json+")");
    if(data.error==1)
    {
	alert('验证错误');
	close_rtc();
	return;
    }
    var iceServers=[];
    for(var x=0;x<data.serverses.length;x++)
    {
        var item = data.serverses[x];
        var iceServer = {
            "urls": item.uris,
            "username": item.username,
            "credential": item.password
        };
        iceServers.push(iceServer);
    }
    config = {'iceServers': iceServers,'iceTransportPolicy':'all','rtcpMuxPolicy':'require','tcpCandidatePolicy':'disabled','bundlePolicy':'max-bundle','continualGatheringPolicy':'gatherContinually','keyType':'ecdsa'};

}

function startVideo(json,jid) {

    console.log("qt:json");
    console.log(json);
    console.log("qt:jid");
    console.log(jid);
    console.trace();
    caller = true;
    toJid = jid;
    playTone();
    enableVideo = true;
    initConfigs(json);
    initStream();
    $(".invite_text").text("正在呼叫"+callerUserInfo.nick+"...");
    //超时挂断
    console.log("window.setTimeout"+autoCloseTime);
    window.setTimeout(timeoutClose,autoCloseTime);
}

function startAudio(json,jid) {
    console.log("qt:startAudio:",json,",",jid);
    console.trace();
    caller = true;
    toJid = jid;
    playTone();
    enableVideo = false;
    initConfigs(json);
    initStream();
    $(".invite_text").text("正在呼叫"+callerUserInfo.nick+"...");
    localVideo.style.visibility = "hidden";
    $("#btn_video_mute").hide();
    //超时挂断
    console.log("window.setTimeout"+autoCloseTime);
    window.setTimeout(timeoutClose,autoCloseTime);
}


function timeoutClose() {
    console.log("window.setTimeout timeoutClose");
    //如果对方没有接听
    if(!isConnect){
        var payload = '{"type":"timeout"}';
        CLIENT_API.sendSignal(payload,toJid);
        CLIENT_API.closeRtcWindow(toJid,-1);
    }
}

function setupPeerConn(stream) {
    console.log("qt:setupPeerConn:",stream);
    //parameters.prototype
    parameters = {
        opusStereo:false,
        opusFec:false,
        opusDtx:true,
        videoFec:false,
        audioSendCodec:"opus",
        audioRecvCodec:"opus",
        videoSendCodec:"VP9",
        videoRecvCodec:"VP9",
        audioSendBitrate:48,
        audioRecvBitrate:16,
        videoSendBitrate:1500,
        videoRecvBitrate:1000,
        videoSendInitialBitrate:1000,
        opusMaxPbr:48
    };
    // Whether we gather IPv6 candidates.
    var pcConstraints={};
    pcConstraints.optional = [{'googIPv6': true}];
    peerConn = new RTCPeerConnection(config,pcConstraints);
    peerConn.addStream(stream);
    peerConn.onaddstream=function(e) {
        remoteVideo.srcObject = e.stream;
    };

    peerConn.oniceconnectionstatechange = function(event) {
        if (pc.iceconnectionstate === "failed" ||
            pc.iceconnectionstate === "disconnected" ||
            pc.iceconnectionstate === "closed") {
            alert("连接中断");
            CLIENT_API.closeRtcWindow(toJid,-1);
        }
    };
    peerConn.oniceconnectionstatechange = function(event) {
        console.log("ICE STATE CHANGED: " + JSON.stringify(event)+" "+pc.iceconnectionstate);
        writeLog("oniceconnectionstatechange");
    };

    peerConn.onsignalingstatechange=function (event) {
        if (peerConn.signalingState === "stable") {
            writeLog("stable");
        }
        else if (peerConn.signalingState === "have-local-offer") {
            writeLog("have-local-offer");
        }else if (peerConn.signalingState === "have-remote-offer") {
            writeLog("have-remote-offer");
        }else if (peerConn.signalingState === "have-local-pranswer") {
            writeLog("have-local-pranswer");
        }else if (peerConn.signalingState === "have-remote-pranswer") {
            writeLog("have-remote-pranswer");
        }
    };

    peerConn.onicecandidate=function(event) {
        if(event.candidate)
        {
            var candidate = event.candidate;
            var payload = {type:"candidate",payload:{id:candidate.sdpMid,label:candidate.sdpMLineIndex
                ,candidate:candidate.candidate}};
            var result = JSON.stringify(payload);
            console.log("SENDING CANDIDATE: " + result);
            CLIENT_API.sendSignal(result,toJid);
        }
    };
}

function handleCandidates() {
    if(candidates.length>0)
    {
        for(var i=0;i<candidates.length;i++)
        {
            peerConn.addIceCandidate(new RTCIceCandidate(candidates[i]));
	    writeLog(JSON.stringify(candidates[i]));
        }
        candidates = [];
    }
}

function onReceiveOffer(payload) {
    if(enableVideo){
        $("#invite_wrapper").hide();
    }else{
        $('.invite_text').text("正在与"+callerUserInfo.nick+"通话中");
    }

    console.log("qt:onReveiveOffer:",payload);
    payload.payload.sdp = preferRemoteSdp(payload.payload.sdp);
    peerConn.setRemoteDescription(new RTCSessionDescription(payload.payload))
        .then(handleCandidates,function(e) {
		writeLog(e);
        });
    if(isCaller){
        startTime = new Date().getTime();
        isConnect = true;
        isAccept = true;
    }

    peerConn.createAnswer().then(function(desc) {
	desc.sdp = preferLocalSdp(desc.sdp);
        var sdp = desc.sdp.replace(new RegExp("\r\n","gm"),"\\r\\n");
        var payload = {type:"answer",payload:{type:desc.type,
            sdp:sdp}};
        var result = JSON.stringify(payload);
        CLIENT_API.sendSignal(result,toJid);
        peerConn.setLocalDescription(desc).then(
            function() {
            },
            function(e) {
                alert("本地媒体信息初始化失败");
		writeLog(JSON.stringify(e));
            }
        );
    },function(e) {
        alert("应答失败")
    });
}

function onReceiveAnswer(payload) {
    console.log("qt:onReveiveAnswer:",payload);
    payload.payload.sdp = preferRemoteSdp(payload.payload.sdp);
    peerConn.setRemoteDescription(new RTCSessionDescription(payload.payload))
        .then(handleCandidates,function(e) {
	    //alert('error');
	    writeLog(e);
        });

    isConnect = true;
    isAccept = true;
    if(enableVideo){
        $("#invite_wrapper").hide();
    }else{
        $('.invite_text').text("正在与"+callerUserInfo.nick+"通话中");
    }
    if(enableVideo){
        $("#btn_video_mute").show();
    }
    $("#btn_audio_mute").show();
    if(cameraTotal>1){
        $("#btn_switch").show();
    }
    $("#btn_toggle_fullscreen").show();
    if(!isCaller){
        startTime = new Date().getTime();
    }
}

function onReceiveCandidate(payload) {
    console.log("qt:onReveiveCandidate:",payload);
    var candidate = {sdpMid:payload.payload.id,
        sdpMLineIndex:payload.payload.label,
        candidate:payload.payload.candidate};
    if(peerConn.remoteDescription)
    {
        peerConn.addIceCandidate(new RTCIceCandidate(candidate));
        //peerConn.addIceCandidate(candidate);
        writeLog(JSON.stringify(candidate));
    }
    else {
        candidates.push(candidate);
    }
}

function onReceiveDeny(payload) {
    console.log("qt:onReveiveDeny:",payload);
    console.trace();
    CLIENT_API.closeRtcWindow(toJid,-1);

}

function onReceiveBusy(payload) {
    console.log("qt:onReveiveBusy:",payload);
}

function onReceiveClose(payload) {
    console.log("qt:onReveiveClose:",payload);
    endTime = new Date().getTime();
    if(startTime == null){
        startTime = new Date().getTime();
    }
    var payload='{"type":"close"}';
    if(isCaller){
        CLIENT_API.closeRtcWindow(toJid,(endTime-startTime)/1000);
    }else{
        CLIENT_API.closeRtcWindow(toJid,-1);
    }
}

function closePeerConn() {
    if(peerConn)
    {
        peerConn.onaddstream=null;
        peerConn.onicecandidate=null;
        peerConn.close();
    }
}

function accept_rtc() {
    isCaller = false;
    btn_wrapper.className='btn-wrapper online';
    var offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: enableVideo?1:0,
        voiceActivityDetection: true,
	iceRestart:true
    };
    peerConn.createOffer(offerOptions)
        .then(function(desc) {
            desc.sdp = preferLocalSdp(desc.sdp);
            peerConn.setLocalDescription(desc).then(
                function() {
                },
                function(e) {
                    alert("初始化本地媒体错误");
		    writeLog(JSON.stringify(e));
                }
            );

            //send pickup
            var pickup = {"type":"pickup"};
            var pickupJson = JSON.stringify(pickup);
            CLIENT_API.sendSignal(pickupJson,toJid);


            var sdp = desc.sdp.replace(new RegExp("\r\n","gm"),"\\r\\n");
            var payload = {type:"offer",payload:{type:desc.type,
                    sdp:sdp}};
            var result = JSON.stringify(payload);
            CLIENT_API.sendSignal(result,toJid);


        },function(e) {
            alert("初始化本地媒体错误");
	    writeLog(JSON.stringify(e));
        });
}

function initStream() {
    var mediaContraints={
        audio:
        {
           echoCancellation:true,
           googEchoCancellation: true,
           googNoiseReduction:true,
           googAutoGainControl:true
        }
        /*true*/,
        video:enableVideo
    };
    navigator.mediaDevices.getUserMedia(mediaContraints)
        .then(gotStream)
        .catch(function(e) {
	    writeLog("first time:"+JSON.stringify(e));
	    mediaContraints.audio=true;
	    mediaContraints.video=false;
	    navigator.mediaDevices.getUserMedia(mediaContraints)
	   .then(gotStream)
	   .catch(function(e){
             alert('初始化本地媒体错误');
             writeLog(JSON.stringify(e));
	   })
        });
}

function gotStream(stream) {
    console.log("qt:gotStream:",stream);
    localVideo.srcObject = stream;
    localStream = stream;
    setupPeerConn(localStream);
}

function deny() {
    if(!isConnect){
        var payload = '{"type":"deny"}';
        CLIENT_API.sendSignal(payload,toJid);
        CLIENT_API.closeRtcWindow(toJid,-1);
    }else{
        endTime = new Date().getTime();
        if(startTime == null){
            startTime = new Date().getTime();
        }
        var payload='{"type":"close"}';
        CLIENT_API.sendSignal(payload,toJid);
        CLIENT_API.closeRtcWindow(toJid,(endTime-startTime)/1000);
    }
}

function close_rtc(){
    if(!isConnect){
        var payload = '{"type":"cancel"}';
        CLIENT_API.sendSignal(payload,toJid);
        CLIENT_API.closeRtcWindow(toJid,-1);
    }else{
        endTime = new Date().getTime();
        if(startTime == null){
            startTime = new Date().getTime();
        }
        var payload='{"type":"close"}';
        CLIENT_API.sendSignal(payload,toJid);
        CLIENT_API.closeRtcWindow(toJid,(endTime-startTime)/1000);
    }
}

function preferRemoteSdp(sdp) {
    console.log("qt:preferRemoteSdp-before:",sdp);
    sdp = maybeSetOpusOptions(sdp, parameters);
    sdp = maybePreferAudioSendCodec(sdp, parameters);
    sdp = maybePreferVideoSendCodec(sdp, parameters);
    sdp = maybeSetAudioSendBitRate(sdp, parameters);
    sdp = maybeSetVideoSendBitRate(sdp, parameters);
    sdp = maybeSetVideoSendInitialBitRate(sdp, parameters);
    sdp = maybeRemoveVideoFec(sdp, parameters);
    console.log("qt:preferRemoteSdp-after:",sdp);
    return sdp;
}

function preferLocalSdp(sdp) {
    console.log("qt:preferLocalSdp:",sdp);
    sdp = maybePreferAudioReceiveCodec(
        sdp,
        parameters);
    sdp = maybePreferVideoReceiveCodec(
        sdp,
        parameters);
    sdp = maybeSetAudioReceiveBitRate(
        sdp,
        parameters);
    sdp = maybeSetVideoReceiveBitRate(
        sdp,
        parameters);
    sdp = maybeRemoveVideoFec(
        sdp,
        parameters);
    console.log("qt:after modified preferLocalSdp:", sdp);

    return sdp;
}

function writeLog(log)
{
    if(DEBUG)
    {
        CLIENT_API.WriteLocalLog(toJid,log);
    }
}

function playTone()
{
    try{
        if(CLIENT_API.StartVideoSound)
        {
	    CLIENT_API.StartVideoSound(toJid);	
        }
    }catch(e)
    {
        writeLog(e);
    }
}

function stopTone()
{
    try{

        if(CLIENT_API.StopVideoSound)
        {
             CLIENT_API.StopVideoSound(toJid);
        }
    }catch(e)
    {
	writeLog(e);
    }
}


function toggleVideoMute() {
    if (peerConn) {
        var senders = peerConn.getSenders();
        if (senders != null && senders.length !== 0) {

            if($("#btn_video_mute").hasClass("btn-camera")){
                $("#btn_video_mute").removeClass("btn-camera").addClass("btn-camera_disable");
            }else{
                $("#btn_video_mute").removeClass("btn-camera_disable").addClass("btn-camera");
            }
            senders.forEach(sender => {
                if (sender.track.kind === "video") {
                    sender.track.enabled = !sender.track.enabled
                }
            });
        }
    }
}

function toggleAudioMute() {
    if (peerConn) {
        var senders = peerConn.getSenders();
        if (senders != null && senders.length !== 0) {

            if($("#btn_audio_mute").hasClass("btn-microphone")){
                $("#btn_audio_mute").removeClass("btn-microphone").addClass("btn-microphone_disable");
            }else{
                $("#btn_audio_mute").removeClass("btn-microphone_disable").addClass("btn-microphone");
            }

            senders.forEach(sender => {
                if (sender.track.kind === "audio") {
                    sender.track.enabled = !sender.track.enabled
                }
            });
        }
    }
}
function togglAudioMute() {
    if (peerConn) {
        var senders = peerConn.getSenders();
        if (senders != null && senders.length !== 0) {
            senders.forEach(sender => {
                if (sender.track.kind === "audio") {
                    sender.track.enabled = !sender.track.enabled
                }
            });
        }
    }
}


function switchCamera() {
    var videoDevicesId = [];
    var videoInputCnt = 0;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        devices.forEach(dev => {
            if (dev.kind === "videoinput") {
                videoInputCnt += 1;
                videoDevicesId.push(dev.deviceId);
            }
        });
        if (videoInputCnt > 1) {
            let senders = peerConn.getSenders();
            if (senders != null) {
                senders.forEach(sender => {
                    if (sender.track.kind === "video") {
                        let originSourceId = sender.track.getCapabilities().deviceId;
                        let newSourceId = '';
                        videoDevicesId.forEach(id => {
                            if (id !== originSourceId) {
                                newSourceId = id
                            }
                        });
                        let constraints = {
                            video: {
                                deviceId: {
                                    exact: newSourceId
                                }
                            }
                        };
                        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                            let newVideoTrack = stream.getVideoTracks()[0];
                            sender.replaceTrack(newVideoTrack);
                            localStream = null;
                            localVideo.srcObject = null;
                            localVideo.srcObject = stream;
                            localStream = stream;
                        })
                    }
                })
            }
        }
    });
}

function autoShowCameraBtn() {
    var videoInputCnt = 0;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        devices.forEach(dev => {
            if (dev.kind === "videoinput") {
                videoInputCnt += 1;
            }
        });
        if (videoInputCnt <= 1) {
            cameraTotal = videoInputCnt;
            $("#btn_switch").hide();
        }
    });
}


function isChromeApp() {
    return (typeof chrome !== 'undefined' &&
        typeof chrome.storage !== 'undefined' &&
        typeof chrome.storage.local !== 'undefined');
}

function isFullScreen() {
    if (isChromeApp()) {
        return chrome.app.window.current().isFullscreen();
    }

    return !!(document.webkitIsFullScreen || document.mozFullScreen ||
        document.isFullScreen); 
}


function toggleFullScreen(){
        if (!isFullScreen()) {
            document.body.webkitRequestFullScreen();
        } else {
            document.webkitExitFullscreen() ? document.webkitExitFullscreen(): document.webkitCancelFullScreen();
        }
        if($("#btn_toggle_fullscreen").hasClass("btn-maxmize")){
            $("#btn_toggle_fullscreen").removeClass("btn-maxmize").addClass("btn-minimize");
        }else{
            $("#btn_toggle_fullscreen").removeClass("btn-minimize").addClass("btn-maxmize");
        }
/*        if($(".btn-maxmize"))
        $(".btn-maxmize").css(".")*/
}

