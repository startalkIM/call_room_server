package org.kurento.room.util;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.config.CookieSpecs;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkArgument;


public class HttpClientUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(HttpClientUtils.class);

    private static final String USER_AGENT = "qchat_api(java)";
    private static final int SO_TIMEOUT = 600000;
    private static final int CONN_TIMEOUT = 60000;
    private static final int MAX_REDIRECTS = 3;//重定向的最大次数
    private static final PoolingHttpClientConnectionManager poolManage;
    private static final RequestConfig requestConfig;

    static {
        requestConfig = RequestConfig.custom().setSocketTimeout(SO_TIMEOUT).setConnectTimeout(CONN_TIMEOUT)
                .setMaxRedirects(MAX_REDIRECTS).setCookieSpec(CookieSpecs.IGNORE_COOKIES).build();
        poolManage = new PoolingHttpClientConnectionManager();
        poolManage.setMaxTotal(600);
        poolManage.setDefaultMaxPerRoute(300);
    }

    /**
     * 从连接池中获取HttpClient
     *
     * @return HttpClient
     */
    public static HttpClient initHttpClient() {
        return HttpClients.custom().setUserAgent(USER_AGENT).setConnectionTimeToLive(1L, TimeUnit.MINUTES).setDefaultRequestConfig(requestConfig)
                .setConnectionManager(poolManage).setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE).build();
    }

    /**
     * 从连接池中获取HttpClient，并且不验证ssl证书
     *
     * @param enableSSLCerValidate 是否验证ssl证书
     * @return HttpClient
     */
    public static HttpClient initHttpClient(boolean enableSSLCerValidate) {
        if (!enableSSLCerValidate) {
            return initHttpClient();
        } else {
            return HttpClients.custom().setUserAgent(USER_AGENT).setConnectionTimeToLive(1L, TimeUnit.MINUTES).setDefaultRequestConfig(requestConfig)
                    .setConnectionManager(poolManage).build();
        }
    }

    /**
     * GET方法
     *
     * @param url url
     * @return Http返回结果
     */
    public static String get(String url) {
        checkArgument(url != null && !url.isEmpty(), "url should not be null or empty");
        HttpClient hc = initHttpClient();
        HttpGet get = new HttpGet(url);
        String res = null;
        try {
            HttpResponse response = hc.execute(get);
            int status = response.getStatusLine().getStatusCode();
            if (status == HttpStatus.SC_OK) {
                res = EntityUtils.toString(response.getEntity());
            } else {
                LOGGER.info("get method is not ok,status:{}", status);
            }
        } catch (IOException e) {
            LOGGER.info("get method error,url:{}", url, e);
        } finally {
            get.releaseConnection();
        }
        return res;
    }

    /**
     * post方法传递json
     *
     * @param url      url
     * @param jsonBody json参数
     * @return Http返回结果
     */
    public static String postJson(String url, String jsonBody) {
        checkArgument((url != null && !url.isEmpty() && jsonBody != null && !jsonBody.isEmpty()), "url or jsonBody should not be null or empty");
        HttpClient hc = initHttpClient();
        HttpPost post = new HttpPost(url);
        HttpEntity entity = new StringEntity(jsonBody, ContentType.APPLICATION_JSON);
        post.setEntity(entity);
        String res = null;
        try {
            HttpResponse response = hc.execute(post);
            int status = response.getStatusLine().getStatusCode();
            if (status == HttpStatus.SC_OK) {
                res = EntityUtils.toString(response.getEntity());
            } else {
                LOGGER.info("post json is not ok,status:{},url:{},jsonBody:{}", status, url, jsonBody);
            }
        } catch (IOException e) {
            LOGGER.info("post json error,url:{},jsonBody:{}", url, jsonBody, e);
        } finally {
            post.releaseConnection();
        }
        return res;
    }


    public static String post(String url, Map<String, String> params) {
        checkArgument(url != null && !url.isEmpty() && params != null && !params.isEmpty());

        List<NameValuePair> pairList = params.entrySet().stream().map(entry -> new BasicNameValuePair(entry.getKey(), entry.getValue())).collect(Collectors.toList());
        return post(url, pairList);
    }


    public static String encodeUrl(String params) {
        try {
            return URLEncoder.encode(params, "utf-8");
        } catch (UnsupportedEncodingException e) {
            LOGGER.error("encode {} error", params, e);
            return params;
        }
    }
    public static String post(String url, List<NameValuePair> nvList) {
        checkArgument(url != null && !url.isEmpty() && !CollectionUtils.isEmpty(nvList));
        HttpClient hc = initHttpClient();
        HttpPost post = new HttpPost(url);
        String res = null;
        try {
            HttpEntity entity = new UrlEncodedFormEntity(nvList, "utf-8");
            post.setEntity(entity);
            HttpResponse response = hc.execute(post);
            int status = response.getStatusLine().getStatusCode();
            if (status == HttpStatus.SC_OK) {
                res = EntityUtils.toString(response.getEntity());
            } else {
                LOGGER.info("post method is not 200,code:{},url:[{}],params:[{}]", status, url, nvList.stream().map(nv ->
                        nv.getName()+ "->"+ nv.getValue()).collect(Collectors.joining(", ")));
            }
        } catch (IOException e) {
            LOGGER.info("post method is not ok,url:{},params:[{}]", url, nvList.stream().map(nv ->
                    nv.getName()+ "->"+ nv.getValue()).collect(Collectors.joining(", ")));
        } finally {
            post.releaseConnection();
        }
        return res;
    }

}
