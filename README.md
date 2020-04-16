# 音视频服务

## 简介
* 本项目是Startalk的音视频项目,为Startalk提供音视频能力
* 包含单人音视频/群组会议的PC端web项目,与IOS、Android端通讯需要下载Startalk客户端
* 基于开源项目[kurento](http://www.kurento.org)进行的二次开发
* 主要功能：单人音视频、群组会议视频
* 依赖的服务：kurento的kms流媒体服务器、coturn的打洞服务、Startalk的后端服务
* 部分文档路径请参考部署过程中代码clone的路径自行修改

## 项目结构
  * `kurento-room-sdk` - kurento提供的群视频模块JAVA SDK.
  * `kurento-room-server` - 房间管理服务，提供客户端与服务器的WebSockets API与HTTP API.
  * `kurento-room-client` - 使用WebSockets和JSON-RPC与客户端交互的Java库.
  * `kurento-room-client-js` - Kurento提供的JavaScript库.
  * `kurento-room-pc` - 单人视频与群组视频的PC端项目.


## 部署方法

### 环境要求
  - 推荐Centos7.x环境下部署
  - 支持WebRtc的浏览器或Startalk作客户端
  
### KMS部署
目前Kurento的KMS流媒体服务支持部署在Ubuntu 16.04（Xenial)和18.04 (Bionic),Centos系统下KMS需要部署在Docker上

#### Ubuntu下部署KMS

```
1.更新系统选择
DISTRO="xenial"  # 系统为Ubuntu 16.04 (Xenial)时执行
DISTRO="bionic"  # 系统为Ubuntu 18.04 (Bionic)时执行
    
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83
sudo tee "/etc/apt/sources.list.d/kurento.list" >/dev/null <<EOF
deb [arch=amd64] http://ubuntu.openvidu.io/dev $DISTRO kms6
EOF
2.安装KMS
sudo apt-get update
sudo apt-get install --yes kurento-media-server-6.0
3.启动KMS服务
sudo service kurento-media-server-6.0 start
```

#### Centos Docker下部署KMS

```
1.安装Docker
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum makecache fast
sudo yum -y install docker-ce
sudo systemctl start docker

2.下载Kurento Docker镜像 
cd /home
sudo mkdir kms
cd kms
sudo yum install git 
sudo git clone https://github.com/Kurento/kurento-docker.git
cd kurento-docker/docker
3.运行镜像（映射KMS的8888端口到Centos服务器）
sudo docker run -d --name kms -p 8888:8888     kurento/kurento-media-server:latest
```

### 打洞服务器
使用开源项目coturn
https://github.com/coturn/coturn

```
1.下载安装依赖
cd /home
sudo wget https://github.com/downloads/libevent/libevent/libevent-2.0.21-stable.tar.gz
sudo tar zxvf libevent-2.0.21-stable.tar.gz
cd libevent-2.0.21-stable 
sudo ./configure
sudo make && sudo make install

sudo yum install openssl-devel -y

2.下载编译运行coturn
cd /home
sudo git clone https://github.com/coturn/coturn
cd coturn 
sudo ./configure 
sudo make 
sudo make install

3.生成证书(如果有公证书，可以跳过此步)
sudo yum install openssl
sudo openssl req -x509 -newkey rsa:2048 -keyout /etc/startalk_pkey.pem -out /etc/startalk_cert.pem -days 99999 –nodes

4.修改配置文件
cd /usr/local/etc/
#备份一份默认的配置文件
sudo cp turnserver.conf.default turnserver.conf
sudo vim turnserver.conf

#查看网卡信息，找出公网ip与内网ip
sudo ifconfig 
#修改turnserver.conf中的配置

    relay-device=eth0
    listening-ip=172.xx.xx.xx
    #内网地址
    listening-port=3478
    tls-listening-port=5349
    #内网地址
    relay-ip=172.xx.xx.xx
    #外网地址
    external-ip=47.xx.xx.xx
    relay-threads=50
    lt-cred-mech
    #ssl证书
    cert=/etc/startalk_cert.pem
    pkey=/etc/startalk_pkey.pem
    pidfile="/var/run/turnserver.pid"
    min-port=49152
    max-port=65535
    #用户名密码
    user=startalk:startalk
    mobility
    no-cli
    no-sslv2
    no-sslv3
    
5.启动coturn服务
sudo turnserver -v -a -o -c /usr/local/etc/turnserver.conf   
```
> **注意打开防火墙的相关接口，然后重启防火墙，可以去[这里](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) 测试打洞服务是否部署成功**

### 音视频JAVA服务
```
1.下载项目
cd /home
sudo git clone xxxx(clone本项目)

2.修改项目配置
sudo vim ./kurento-room-server/src/main/resources/app.properties
-----------------------------------------------------------------------------
    #房间最大人数
    kmsLimit=100
    #主讲人自动切换间隔时间
    rtc_update_speaker_interval_default =1800
    
    #kms服务URL
    rtc_kms_url =ws://47.xx.xx.xx:8888/kurento
    
    #turn列表(多个用,隔开)
    rtc_turn_urls=turn:xxxx.xxxx.com:3478
    #turn用户名
    rtc_turn_username=xxxx
    #turn密码
    rtc_turn_password=xxxx
    
    #群视频http接口
    conference_http_server=https://xxxx.xxxx.xxxx/room
    #群视频wss接口
    conference_wss_server=wss://xxxx.xxxx.xxxx:8443/room
    
    #获取名片URL
    rtc_get_user_info_url =http://xxxx.xxxx.xxxx/get_user_info

       
    # Redis settings(如果需要验ckey)
    redis_pool_maxIdle=100
    redis_pool_maxActive=200
    redis_pool_maxWaitMillis=5000
    redis_sentinel_host1=xxxx.xxxx.xxxx:xxxx
    redis_sentinel_host2=xxxx.xxxx.xxxx:xxxx
    redis_sentinel_master=xxxx
    redis_sentinel_pass=xxxx
    redis_sentinel_table=1
-----------------------------------------------------------------------------

3.配置https
项目中默认配置的是kurento提供的自签证书，实际生产项目中换成自己的CA证书，或者使用Java的Keytool来自己生成证书

sudo keytool -genkey -alias startalk -keyalg RSA -keystore /home/call_room_server/kurento-room-pc/package/files/startalk.keystore
按照提示填写密码、城市的等信息，然后修改spring boot的配置
sudo vim /home/call_room_server/kurento-room-pc/package/files/application.properties

4.编译打包项目
cd /home/call_room_server  
mvn clean package -am -pl kurento-room-pc -DskipTests  
cd kurento-room-pc/target  
可以看到打包生成kurento-room-pc-6.6.0.war   
5.将war 包放在Tomcat下启动   
 5.1、cd /startalk/tomcat   
 5.2、cp apache-tomcat-8.5.37 video  
 5.3、rm -rf /startalk/tomcat/video/webapps/ROOT  
 5.4、将编译打包产生的kurento-room-pc-6.6.0.war 放在Tomcat下  
   mv kurento-room-pc-6.6.0.war /startalk/tomcat/video/ROOT.war
 5.5、将服务的监听端口改成9004  
  vim /startalk/tomcat/video/conf/server.xml 第60行8080修改为9004 
 5.6、启动服务
   cd /startalk/tomcat/video && ./bin/startup.sh 
 5.7、查看服务是否启动
  netstat -antp | grep 9004
```
