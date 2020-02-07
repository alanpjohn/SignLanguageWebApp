sudo rsync -r --delete-excluded --force /home/ubuntu/http-temp/ /home/ubuntu/http-server
sudo rm -rf /home/ubuntu/http-temp 
cd /home/ubuntu/http-server
npm i 
cd /home/ubuntu
pm2 /home/ubuntu/http-server/restart index.js
pm2 save