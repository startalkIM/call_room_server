#!/bin/bash
sudo service kurento-media-server-6.0 stop
sudo service kurento-media-server-6.0 start
sudo /root/kurento-room/kurento-room-pc/target/kurento-room-pc-6.6.0/bin/start.sh
