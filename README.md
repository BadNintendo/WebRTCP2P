# WebRTCP2P
A project that is nowhere near completed. It is WebRTC P2P Express, Socket.IO based. I will attempt to create a working repository for others to be able to use the project. I would love someone to make this SFU but the challenge is a bit much for me. 


Chat Hobby WebRTC Streaming Meetup Old Project Slightly updated.

Best way to handle this project is manually. Once you are sure it works properly you can use npm start.
Operating Syetem of choice is Centos 7! best of luck on other!

Step 1.
cd WebRTCP2P
sudo npm install


if unable to install packages manually use `sudo npm i "package name"`
once all npm packages are correctly installed with dated versions move into generating self assigned certs.


Step 2. 
sudo yum install mod_ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt

Output
Country Name (2 letter code) [XX]:US
State or Province Name (full name) []:Example
Locality Name (eg, city) [Default City]:Example 
Organization Name (eg, company) [Default Company Ltd]:Example Inc
Organizational Unit Name (eg, section) []:Example Dept
Common Name (eg, your name or your server's hostname) []:your_domain_or_ip
Email Address []:webmaster@example.com

Step 3.
sudo node node.js

if any issues install packages manually use `sudo npm i` this is a operational half arsed chat coded a while back.
this should work witout directing the io() anywhere. If you would like to setup ports use socket.io documention to do so. 
