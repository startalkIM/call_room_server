package org.kurento.room.pc;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class UrlNavController {
    @RequestMapping("/single")
    public String single() {
        return "/singleFile/index";
    }

    @RequestMapping("/conference")
    public String conference() {
        return "/conferenceFile/index";
    }

}
