package org.kurento.room.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.kurento.room.service.InfoService;
import org.kurento.room.util.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
public class NavController {

    private static final Logger LOGGER = LoggerFactory.getLogger(NavController.class);

    @Autowired
    InfoService InfoService;


    @CrossOrigin
    @RequestMapping(value = "/rtc", method = RequestMethod.GET)
    public String rtcNav(@RequestParam(value = "action",required = false) String action, @RequestParam(value = "method",required = false) String method, @RequestParam("username") String ckey, HttpServletRequest request) throws JsonProcessingException {
        LOGGER.info("into rtc nav localPath:{}, action:{}, method:{}, ckey:{}", request.getRequestURL(), action, method, ckey);

        if (action != null && action.length() > 0) {
            if (method != null && method.equals("get_servers")) {
                return InfoService.getServers(ckey);
            }
        } else {
            return InfoService.getTurnServers(ckey);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("ret", false);
        result.put("errcode", 1);
        result.put("errmsg", "get url error");
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(result);
    }
}
