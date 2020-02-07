sudo rsync -r --delete-excluded --force /home/ubuntu/http-temp/ /home/ubuntu/http-server
sudo rm -rf /home/ubuntu/http-temp 
pm2 /home/ubuntu/http-server/restart index.js
cd /home/ubuntu
pm2 save