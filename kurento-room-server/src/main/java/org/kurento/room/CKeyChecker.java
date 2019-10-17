package org.kurento.room;

import com.google.common.base.Splitter;
import org.kurento.room.util.ShardedJedisSentinelPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.DigestUtils;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;


public class CKeyChecker {

    @Autowired
    ShardedJedisSentinelPool pool;

    private static final Logger LOG = LoggerFactory.getLogger(CKeyChecker.class);
    private static final String DEFAULT_HOST = "";
    private static final String ARGS_SPLITTER = "&";
    private static final String ARG_JOINER = "=";
    private static final String JOINER_USER_HOST = "@";
    private static final String U = "u";
    private static final String T = "t";
    private static final String K = "k";
    private static final String D = "d";


    public String checkCKEY(String ckey) {
        Base64.Decoder decoder = Base64.getDecoder();
        String CKey = new String(decoder.decode(ckey));
        Map<String, String> args = getUserCkeyArgs(CKey);
        if (args == null || args.isEmpty()) {
            return null;
        }
        if (!args.containsKey(D)) {
            args.put(D, DEFAULT_HOST);
        }
        if (!args.containsKey(D) || !args.containsKey(U) || !args.containsKey(T) || !args.containsKey(K)) {
            return null;
        }
        ShardedJedisSentinelPool.MyShardedJedis jedis = null;
        try {
            jedis = pool.getResource();
            Set<String> tokenRedis = jedis.hkeys(args.get(U) + JOINER_USER_HOST + args.get(D));
            if (checkUserAuth(args.get(U), args.get(T), args.get(K), tokenRedis)) {
                return args.get(U)+JOINER_USER_HOST+args.get(D);
            }
            return null;
        } finally {
            if (jedis != null) {
                pool.returnResource(jedis);
            }
        }

    }

    private Map<String, String> getUserCkeyArgs(String Ckey) {
        try {
            Map<String, String> map = new HashMap<String, String>();
            Map<String, String> map0 = Splitter.on(ARGS_SPLITTER).withKeyValueSeparator(ARG_JOINER).split(Ckey);
            for (String key : map0.keySet()) {
                map.put(key, map0.get(key));
            }
            return map;
        } catch (Exception e) {
            LOG.error("Ckey 参数分离出现异常，异常信息：{}", e);
        }
        return null;
    }

    private boolean checkUserAuth(String user, String t, String k, Set<String> redisTokens) {
        String lowKey = k.toLowerCase();
        if (redisTokens.isEmpty()) {
            return false;
        }
        for (String redisToken : redisTokens) {
            if (lowKey.equals(DigestUtils.md5DigestAsHex((redisToken + t).getBytes()))) {
                LOG.info("用户{},验证通过", user);
                return true;
            }
        }
        LOG.info("用户{},验证不通过", user);
        return false;
    }
}
