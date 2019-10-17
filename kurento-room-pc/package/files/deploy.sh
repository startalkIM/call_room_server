#!/bin/bash
cd ~/kurento-room
git pull
~/maven.sh
cd ~/kurento-room/kurento-room-pc/target
unzip -o kurento-room-pc-6.6.0.zip
chmod 755 ~/kurento-room/kurento-room-pc/target/kurento-room-pc-6.6.0/bin/*
~/launch.sh