## Intended way to use
This is meant to be an easy way to get going with the td ameritrade apis without having to worry about how to call and refresh the tokens. all you have to do is start this server when you want to write your app and then in your code just do a simple GET call to https://[host]:[port]/data . It will return a json obj that has an "access_token" attribute that you can use for all other calls. Get a new access token before every call you make though if you want to ensure it isnt expired. there is logic in this code writen to handle token expiration and refreshing. The service caches the token in memory so unless it has to refresh at the same time you are calling it should be pretty instant. If you want to force a refresh you can call the api at https://[host]:[port]/auth/refresh . also the root url (https://[host]:[port]/) can be used to check the status of the service.

## Getting Started
- Install latest version of NodeJS https://nodejs.org/en/
- clone the repo
- go into the index.js folder and change the CLIENT_ID at the top to yours and then go to the run the server steps below

## To Run the Server
- go to root of folder
- run npm install
- run npm start
- enter data into prompts and then it will start and launch chrome

## Generating self signed cert to secure API in dev env
- Need openssl tool
- *command for mac* openssl req -newkey rsa:2048 -nodes -subj '/CN=localhost' -keyout key.pem -x509 -days 365 -out cert.pem  

## Give your app permission to use TD Ameritrade (one time)
https://auth.tdameritrade.com/auth?response_type=code&redirect_uri={Callback URL}&client_id={Consumer Key}@AMER.OAUTHAP
