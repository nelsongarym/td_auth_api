const fs = require('fs');
const https = require('https');
const utils = require('./utils');
const express = require('express');
const app = express();
const NodeCache = require('node-cache');
const tokenCache = new NodeCache({checkperiod:30});
const tokenFilePath='./token_info.json';

const CLIENT_ID = "[INSERT THE CLIENT ID HERE xx@AMER.OAUTHAP]"

const {handleTDCallback, handleTDRefresh, getSPYQuotes} = utils(tokenCache);

tokenCache.set("client_id",CLIENT_ID);
    tokenCache.set("host","https://localhost");
    tokenCache.set("port",81);
    tokenCache.on("expired", (key, value) => {
        if(key==='access_token') {
            handleTDRefresh().then(refreshed => console.log("token refreshed after expiration"))
        }
    });


const startServer = () => {

// load in ssl keys
const privateKey  = fs.readFileSync('./test_certs/key.pem', 'utf8');
const certificate = fs.readFileSync('./test_certs/cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};
const port = tokenCache.get("port");
 
// start secured server
const httpsServer = https.createServer(credentials, app);
console.log(`Listening on port ${port}...`);
httpsServer.listen(port);

// setup endpoint to get token
app.get('/', async (req, res) => {
    if(tokenCache.get("access_token")) {
        const quotes = await getSPYQuotes();
        res.send(`<div><h1>TD Ameritrade Awesomeness</h1><img src="https://media.giphy.com/media/xT8qAY7e9If38xkrIY/giphy.gif" width="200px" height="250px" />${quotes}<h3>Token Info</h3><p>${JSON.stringify(tokenCache.get("token_info"))}</p></div>`);
    } else {
        res.redirect(`https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${tokenCache.get("host")}:${tokenCache.get("port")}/auth/callback&client_id=${tokenCache.get("client_id")}`);
    }
});
app.get('/data', (req, res) => {
    res.send(tokenCache.get("token_info"));
});
app.get('/auth', handleTDCallback);
app.get('/auth/callback', async (req,res) => {
    const payload = await handleTDCallback(req.query.code);
    res.redirect(`${tokenCache.get("host")}:${tokenCache.get("port")}/`);
});
app.get('/auth/refresh', async (req,res) => {
    const payload = await handleTDRefresh();
    res.send(payload);
});
}

// Initialize cache
try {
    if (fs.existsSync(tokenFilePath)) {
        const rawdata = fs.readFileSync(tokenFilePath);
        const token_info = JSON.parse(rawdata);
        tokenCache.set("token_info", token_info );
        tokenCache.set("refresh_token", token_info.refresh_token, token_info.refresh_token_expires_in );
        handleTDRefresh().then(refreshed => {
            console.log("refreshed afeter reading from file");
            startServer();
        }).catch(e => {
            console.log("failed refreshed afeter reading from file");
            startServer();
        });
    }
    else {
        startServer();
    }
  } catch(err) {
    console.log("no file yet");
  }