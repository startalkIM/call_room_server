/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.kurento.room.pc;

import java.util.Collections;
import java.util.List;
import org.kurento.room.KurentoRoomServerApp;
import org.kurento.room.kms.KmsManager;
import org.kurento.room.rpc.JsonRpcUserControl;
import org.kurento.room.util.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;


/**
 * Demo application for Kurento Room, extends the Room Server application class. Uses the Room
 * Client JS library for the web client, which is built with AngularJS and lumx.
 *
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @author Radu Tom Vlad (rvlad@naevatec.com)
 * @since 5.0.0
 */
public class KurentoRoomApp extends KurentoRoomServerApp {

  private static final Logger log = LoggerFactory.getLogger(KurentoRoomApp.class);
  private final Integer DEMO_KMS_NODE_LIMIT = Config.KMS_LIMIT;
  private final String DEMO_AUTH_REGEX = Config.AUTH_REGEX;

  @Override
  public KmsManager kmsManager() {
    List<String> kmsWsUris = Collections.singletonList(Config.KMS_URL);

    log.info("Configuring Kurento Room Server to use the following kmss: " + kmsWsUris);

    FixedNKmsManager fixedKmsManager = new FixedNKmsManager(kmsWsUris, DEMO_KMS_NODE_LIMIT);
    fixedKmsManager.setAuthRegex(DEMO_AUTH_REGEX);
    log.debug("Authorization regex for new rooms: {}", DEMO_AUTH_REGEX);
    return fixedKmsManager;
  }

  @Override
  public JsonRpcUserControl userControl() {
    return new PCJsonRpcUserControl(roomManager());
  }

  public static void main(String[] args) throws Exception {
    log.info("Using /dev/urandom for secure random generation");
    System.setProperty("java.security.egd", "file:/dev/./urandom");
    SpringApplication.run(KurentoRoomApp.class, args);
  }
}
