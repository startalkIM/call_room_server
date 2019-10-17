package org.kurento.room.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.kurento.room.CKeyChecker;
import org.kurento.room.NotificationRoomManager;
import org.kurento.room.rest.RoomController;
import org.kurento.room.rest.model.TurnServer;
import org.kurento.room.util.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InfoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RoomController.class);
    @Autowired
    NotificationRoomManager roomManager;

    private String turnUrls = Config.TURN_URLS;
    private String turnUsername = Config.TURN_USERNAME;
    private String turnPassword = Config.TURN_PASSWORD;


    private String conferenceHttpServer = Config.CONFERENCE_HTTP_SERVER;
    private String conferenceWSSServer = Config.CONFERENCE_WSS_SERVER;
    @Autowired
    CKeyChecker cKeyChecker;


    public String getTurnServers(String ckey) throws JsonProcessingException {
        LOGGER.info("into validate ckey get turn server :{}", ckey);
        Map<String, Object> finalObject = new HashMap<>();
        final Integer ttl = 600;
        final String iceTransportPolicy = "relay";

        List<String> uris = new ArrayList<>();
        final String username = turnUsername;
        final String password = turnPassword;
        List<String> turnUrlList = Arrays.asList(turnUrls.split(","));
        turnUrlList.forEach(turn->{
            uris.add(turn+"?transport=tcp");
            uris.add(turn+"?transport=udp");
        });

        final TurnServer turnServer = new TurnServer();
        turnServer.setUris(uris);
        turnServer.setUsername(username);
        turnServer.setPassword(password);
        turnServer.setTtl(ttl);

        List<TurnServer> serverses = new ArrayList<>();
        serverses.add(turnServer);

        ObjectMapper mapper = new ObjectMapper();
        try {
            String userId = cKeyChecker.checkCKEY(ckey);

            if (userId != null) {
                finalObject.put("serverses", serverses);
                finalObject.put("error", 0);
                finalObject.put("errcode", 0);
                finalObject.put("iceTransportPolicy", iceTransportPolicy);
            }
            return mapper.writeValueAsString(finalObject);
        } catch (Exception e) {
            LOGGER.error("check user error", e);
        }

        finalObject.put("errcode", 501);
        finalObject.put("ret", false);
        finalObject.put("message", "CKEY INVALID");
        return mapper.writeValueAsString(finalObject);
    }

    public String getServers(String ckey) throws JsonProcessingException {
        LOGGER.info("into validate ckey get turn server :{}", ckey);
        Map<String, Object> finalObject = new HashMap<>();

        Map<String, Object> serviceMap = new HashMap<>();

        serviceMap.put("server",conferenceHttpServer);
        serviceMap.put("navServ",conferenceWSSServer);

        ObjectMapper mapper = new ObjectMapper();
        try {
            String userId = cKeyChecker.checkCKEY(ckey);

            if (userId != null) {
                finalObject.put("ret", true);
                finalObject.put("data", serviceMap);
                finalObject.put("error", 0);
                finalObject.put("errcode", 0);
            }
            return mapper.writeValueAsString(finalObject);
        } catch (Exception e) {
            LOGGER.error("check user error", e);
        }

        finalObject.put("errcode", 501);
        finalObject.put("ret", false);
        finalObject.put("message", "CKEY INVALID");
        return mapper.writeValueAsString(finalObject);
    }

}
