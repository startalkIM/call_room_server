package org.kurento.room.rest;

import static org.kurento.commons.PropertiesManager.getProperty;

import java.util.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.kurento.room.CKeyChecker;
import org.kurento.room.NotificationRoomManager;
import org.kurento.room.rest.model.TurnServer;
import org.kurento.room.util.Config;
import org.kurento.room.util.HttpClientUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
public class RoomController {


    private static final Logger LOGGER = LoggerFactory.getLogger(RoomController.class);
    @Autowired
    NotificationRoomManager roomManager;

    @Autowired
    CKeyChecker cKeyChecker;

    private String update_speaker_interval_default = Config.UPDATE_SPEAKER_INTERVAL_DEFAULT;
    private String threshold_speaker_default = Config.THRESHOLD_SPEAKER_DEFAULT;
    private String get_user_info_url = Config.GET_USER_INFO_URL;
    private String turnUrls = Config.TURN_URLS;
    private String turnUsername = Config.TURN_USERNAME;
    private String turnPassword = Config.TURN_PASSWORD;

    @RequestMapping("/getAllRooms")
    public Set<String> getAllRooms() {
        return roomManager.getRooms();
    }

    @RequestMapping("/getUpdateSpeakerInterval")
    public Integer getUpdateSpeakerInterval() {
        return Integer.valueOf(getProperty("updateSpeakerInterval", update_speaker_interval_default));
    }

    @RequestMapping("/getThresholdSpeaker")
    public Integer getThresholdSpeaker() {
        return Integer.valueOf(getProperty("thresholdSpeaker", threshold_speaker_default));
    }

    @CrossOrigin
    @RequestMapping(value = "/getSingleTurnServers", method = RequestMethod.GET)
    public String getTurnServers(@RequestParam("username") String ckey) throws JsonProcessingException {
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


    @CrossOrigin
    @RequestMapping(value = "/getTurnServers", method = RequestMethod.GET)
    public String validInfoAndGetTurnServers(@RequestParam("username") String ckey) {
        LOGGER.info("into validate info and get turn server :{}", ckey);
        JsonObject finalObject = new JsonObject();

        try {
            String userId = null;

            if (ckey != null && !ckey.isEmpty()) {
                userId = cKeyChecker.checkCKEY(ckey);
            } else {
                LOGGER.info("user:{} ckey is not exist", ckey);
            }

            if (userId != null) {

                JsonArray turns = new JsonArray();

                List<String> turnUrlList = Arrays.asList(turnUrls.split(","));

                turnUrlList.forEach(turnUrl->{
                    JsonObject turn1 = new JsonObject();
                    turn1.addProperty("urls", turnUrl);
                    turn1.addProperty("username", turnUsername);
                    turn1.addProperty("credential", turnPassword);
                    turns.add(turn1);
                });

                finalObject.add("servers", turns);
                finalObject.addProperty("userId", userId);
                finalObject.addProperty("errcode", 0);
                finalObject.addProperty("ret", true);
                return finalObject.toString();
            }
        } catch (Exception e) {
            LOGGER.error("check user error", e);
        }
        finalObject.addProperty("errcode", 501);
        finalObject.addProperty("ret", false);
        finalObject.addProperty("message", "CKEY INVALID");
        return finalObject.toString();
    }



    @CrossOrigin
    @RequestMapping(value = "/getUserNickByUserName", method = RequestMethod.POST)
    public String transmitRequest(@RequestBody String json) {
        LOGGER.info("into get user nick by user name :{}", json);
        String JsonResult = HttpClientUtils.postJson(get_user_info_url, json);
        LOGGER.info("into get user nick by user name return :{}", JsonResult);
        return JsonResult;
    }

}
