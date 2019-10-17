#!/bin/bash
cd ~/kurento-room
mvn clean package -am -pl kurento-room-pc -DskipTests
