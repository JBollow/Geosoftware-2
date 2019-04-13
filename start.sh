#!/bin/bash
cd ./back-end
echo "Starting back-end"
mkdir data
npm start &
cd ..
cd ./front-end
echo "Starting front-end"
npm start &
cd ..
python ./py_imgProcessing/bottle_server.py &