package org.kurento.room.rest.model;

import java.util.List;

public enum  RtcUrlEnum {
    SINGLE_RTC_URL("single_url",""),
    CONFERENCE_RTC_URL("conference_url",""),
    KMS_URL("kms",""),
    SINGLE_TURN_URL("single_turn",""),
    CONFERENCE_TURN_URL("conference_turn","");


    private String type;
    private String url;

    RtcUrlEnum(String type, String url){
        this.type = type;
        this.url = url;
    }
    public static RtcUrlEnum getRtcUrl(String type) {
        for (RtcUrlEnum actions : RtcUrlEnum.values()) {
            if (actions.getType() == type) {
                return actions;
            }
        }
        throw new IllegalArgumentException("conversion failed.");
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
