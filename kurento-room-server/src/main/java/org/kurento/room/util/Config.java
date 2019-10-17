package org.kurento.room.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;


public class Config {
    private static final Logger LOGGER = LoggerFactory.getLogger(Config.class);

    public static final String KMS_URL = getProperty("rtc_kms_url");

    public static final Integer REDIS_MAXIDLE = getIntProperty("redis_pool_maxIdle",100);
    public static final Integer REDIS_MAX_ACTIVE = getIntProperty("redis_pool_maxActive",200);
    public static final Integer REDIS_MAX_WAIT_MILLIS = getIntProperty("redis_pool_maxWaitMillis",5000);
    public static final String REDIS_HOST1 = getProperty("redis_sentinel_host1");
    public static final String REDIS_HOST2 = getProperty("redis_sentinel_host2");
    public static final String REDIS_MASTER = getProperty("redis_sentinel_master");
    public static final String REDIS_PASS = getProperty("redis_sentinel_pass");
    public static final Integer REDIS_TABLE = getIntProperty("redis_sentinel_table",2);


    public static final String UPDATE_SPEAKER_INTERVAL_DEFAULT = getProperty("rtc_update_speaker_interval_default");
    public static final String THRESHOLD_SPEAKER_DEFAULT = getProperty("rtc_threshold_speaker_default");
    public static final String GET_USER_INFO_URL = getProperty("rtc_get_user_info_url");
    public static final String TURN_URLS = getProperty("rtc_turn_urls");
    public static final String TURN_USERNAME = getProperty("rtc_turn_username");
    public static final String TURN_PASSWORD = getProperty("rtc_turn_password");

    public static final String CONFERENCE_HTTP_SERVER = getProperty("conference_http_server");
    public static final String CONFERENCE_WSS_SERVER = getProperty("conference_wss_server");
    public static final String AUTH_REGEX = getProperty("authRegex");
    public static final Integer KMS_LIMIT = getIntProperty("kmsLimit",100);
    public static final Boolean LOOPBACK_REMOTE = getBooleanItem("loopback_remote",false);
    public static final Boolean LOOPBACK_ANDLOCAL = getBooleanItem("loopback_andLocal",false);
    private static Properties props;

    private synchronized static void init() {
        if (props != null) {
            return;
        }
        InputStreamReader isr = null;
        try {
            String filename = "app.properties";
            isr = new InputStreamReader(Config.class.getClassLoader().getResourceAsStream(filename), "UTF-8");
            props = new Properties();

            props.load(isr);
        } catch (IOException e) {
            throw new ExceptionInInitializerError("Initialize the config error!");
        } finally {
            closeStream(isr);
        }
    }

    public static String getProperty(String name) {
        if (props == null) {
            init();
        }
        String val = props.getProperty(name.trim());
        if (val == null) {
            return null;
        } else {
            //去除前后端空格
            return val.trim();
        }
    }

    public static String getProperty(String name, String defaultValue) {
        if (props == null) {
            init();
        }

        String value = getProperty(name);
        if (value == null) {
            value = defaultValue;
        }
        return value.trim();
    }

    //获得整数属性值
    public static int getIntProperty(String name, int defaultVal) {
        if (props == null) {
            init();
        }

        int val = defaultVal;
        String valStr = getProperty(name);
        if (valStr != null) {
            val = Integer.parseInt(valStr);
        }
        return val;
    }

    //获得double属性值
    public static double getDoubleProperty(String name, double defaultVal) {
        if (props == null) {
            init();
        }

        double val = defaultVal;
        String valStr = getProperty(name);
        if (valStr != null) {
            val = Double.parseDouble(valStr);
        }
        return val;
    }

    public static boolean getBooleanItem(String name, boolean defaultValue) {
        if (props == null) {
            init();
        }

        boolean b = defaultValue;
        String valStr = getProperty(name);
        if (valStr != null) {
            b = Boolean.parseBoolean(valStr);
        }
        return b;
    }

    public static String getPropertyByEncoding(String name) {
        if (props == null) {
            init();
        }

        String val = getProperty(name);
        if (val == null) return null;
        try {
            return new String(val.getBytes("ISO8859-1"), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return val;
        }
    }

    public static String[] getArrayItem(String name) {
        if (props == null) {
            init();
        }

        String value = getProperty(name, "");
        if (value.trim().isEmpty()) {
            return null;
        }

        String sepChar = ",";
        if (value.contains(";")) {
            sepChar = ";";
        }
        return value.split(sepChar);

    }

    public static List<String> getListItem(String item) {
        if (props == null) {
            init();
        }

        List<String> list = new ArrayList<>();
        String value = getProperty(item, "");
        if (value.trim().isEmpty()) {
            return list;
        }

        String sepChar = ",";
        if (value.contains(";")) {
            sepChar = ";";
        }
        String[] sa = value.split(sepChar);
        for (String aSa : sa) {
            list.add(aSa.trim());
        }
        return list;
    }

    public static void setProperty(String name, String value) {
        if (props == null) {
            init();
        }

        props.setProperty(name, value);
    }

    private static void closeStream(InputStreamReader is) {
        if (is == null) {
            return;
        }

        try {
            is.close();
        } catch (IOException e) {
            throw new ExceptionInInitializerError("Initialize the config error!");
        }
    }

}
