sudo rsync -r --delete-excluded --force /home/ubuntu/http-temp/ /home/ubuntu/http-server
sudo rm -rf /home/ubuntu/http-temp 
cd /home/ubuntu/http-server
grep -rl 'http://localhost:3000' index.html | xargs sed -i 's;http://localhost:3000;https://www.clawpro.club;g'
npm i 
cd /home/ubuntu
pm2 flush
pm2 restart /home/ubuntu/http-server/index.js
pm2 save
