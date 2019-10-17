package org.kurento.room.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.common.base.Splitter;
import com.google.common.base.Strings;
import com.google.common.collect.Lists;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;


public class JacksonUtils {
    private static final Logger logger = LoggerFactory.getLogger(JacksonUtils.class);

    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        //序列化时的配置
        objectMapper.configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false);
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.ALWAYS);
        //反序列化时的配置
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        //其他配置
        objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_NON_NUMERIC_NUMBERS, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_NUMERIC_LEADING_ZEROS, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        objectMapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
        objectMapper.configure(JsonParser.Feature.AUTO_CLOSE_SOURCE, true);
    }

    @SuppressWarnings(value = {"unchecked", "unused"})
    public static <T> String obj2String(T obj) {

        if (obj == null) {
            return null;
        }
        try {
            return obj instanceof String ? (String) obj : objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            logger.info("serialize Object to String failed,Object:{}", obj.getClass(), e);
            return null;
        }

    }

    @SuppressWarnings(value = {"unchecked", "unused"})
    public static <T> T string2Obj(String json, Class<T> clazz) {
        if (json == null || json.isEmpty() || clazz == null) {
            return null;
        }
        try {
            return String.class.equals(clazz) ? (T) json : objectMapper.readValue(json, clazz);
        } catch (IOException e) {
            logger.info("deserialize String to Object failed,json:{},class:{}", json, clazz.getName(), e);
            return null;
        }
    }

    @SuppressWarnings("all")
    public static <T> T string2Obj(String json, TypeReference<T> typeReference) {
        if (json == null || json.isEmpty() || typeReference == null) {
            return null;
        }
        try {
            return (T) (String.class.equals(typeReference.getType()) ? json : objectMapper.readValue(json, typeReference));
        } catch (IOException e) {
            logger.info(" deserialize String to Object failed,json:{},type:{}", json, typeReference.getType(), e);
            return null;
        }
    }

    /**
     * string to map
     *
     * @param json json format
     * @return map object
     */
    @SuppressWarnings(value = {"unchecked", "unused"})
    public static Map<String, Object> string2Map(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return (Map<String, Object>) objectMapper.readValue(json, Map.class);
        } catch (IOException e) {
            logger.info("read the json error,json:{}", json, e);
            return null;
        }
    }

    /**
     * string to non_null map
     *
     * @param json json format
     * @return non_null map
     */
    @SuppressWarnings("unused")
    public static Map<String, Object> string2MapWithoutNull(String json) {
        Map<String, Object> resultMap = string2Map(json);
        if (resultMap == null) {
            return Collections.emptyMap();
        }
        return resultMap;
    }

    /**
     * read the node in json,but the node should not have children.
     *
     * @param json      json format string
     * @param paramPath the path should be join with '/',URI.
     * @return node
     */
    @SuppressWarnings("unused")
    public static String getNodeText(String json, String paramPath) {
        if (Strings.isNullOrEmpty(json) || Strings.isNullOrEmpty(paramPath)) {
            return null;
        }
        List<String> path = Lists.newArrayList(Splitter.on('/').omitEmptyStrings().trimResults().split(paramPath));
        JsonNode rootNode;
        try {
            rootNode = objectMapper.readTree(json);
            JsonNode node = rootNode;
            for (String nodeStr : path) {
                node = node.path(nodeStr);
            }
            return node.asText();
        } catch (IOException e) {
            logger.info("read the json node failed,json:{},paramPath:{}", json, paramPath, e);
        }
        return null;
    }

    @SuppressWarnings("unused")
    public static String getJacksonVersion() {
        return objectMapper.version().toString();
    }
}
