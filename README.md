Centos OS version 7 prefeered. WebRTC P2P Socket.IO Chat based on a idea I had. 



Step 1.

cd WebRTCP2P
sudo npm install

if any issues remove package lockfile and then the package from package.json.
you can also chase it by manually installing packages with `sudo npm i package`

Step. 2. 
sudo yum install mod_ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt

note: these belong in the same folder as node.js
Should loo like something in this category when generated.

Output
Country Name (2 letter code) [XX]:US
State or Province Name (full name) []:Example
Locality Name (eg, city) [Default City]:Example 
Organization Name (eg, company) [Default Company Ltd]:Example Inc
Organizational Unit Name (eg, section) []:Example Dept
Common Name (eg, your name or your server's hostname) []:your_domain_or_ip
Email Address []:webmaster@example.com

Step. 3.
sudo node node.js

One you feel like youve installed proper packages if any errors and its running on port 80 and 443. You can use `npm start` but may require premessions. 
If you feel like making this operate on another port. Socket.IO documents or other projects with socket.io can help. 
If you change url socket.io changes add it to `io()` such as `io(url:whatever)`
