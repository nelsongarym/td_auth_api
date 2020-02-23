const axios = require('axios');
const qs = require('querystring');
const fs = require('fs');

module.exports = (cache) => {

    const saveTokenInfo = (data) => {
        cache.set("access_token", data.access_token, data.expires_in);
        if (data.refresh_token) {
            cache.set("token_info", data);
            cache.set("refresh_token", data.refresh_token, data.refresh_token_expires_in);
            fs.writeFileSync('./token_info.json', JSON.stringify(data));
        }
        else {
            const currentData = cache.get("token_info");
            cache.set("token_info", {
                ...currentData,
                ...data
            });
            fs.writeFileSync('./token_info.json', JSON.stringify({
                ...currentData,
                ...data
            }));
        }
    }

    const getAccessToken = async (oAuthCode, client_id, redirect_uri) => axios.request({
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
            grant_type: 'authorization_code',
            access_type: 'offline',
            code: oAuthCode,
            client_id: client_id,
            redirect_uri: redirect_uri,
        }),
    });

    const getRefreshAccessToken = async (refresh_token, client_id) => axios.request({
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: client_id,
        }),
    })

    const handleTDCallback = async (code) => {
        console.log("start callback logic")
        try {
            const client_id = cache.get("client_id");
            const redirect_uri = `${cache.get("host")}:${cache.get("port")}/auth/callback`;
            const response = await getAccessToken(code, client_id, redirect_uri);
            console.log(`access token received`)
            saveTokenInfo(response.data);
            return response.data;
        }
        catch (ex) {
            console.log(ex);
            return "Error during fetch of access token"
        }

    }

    const handleTDRefresh = async () => {
        console.log("start refresh logic")
        try {
            const refresh_token = cache.get("refresh_token");
            const client_id = cache.get("client_id");
            const response = await getRefreshAccessToken(refresh_token, client_id);

            console.log(`refresh token received: ${JSON.stringify(response.data)}`)
            saveTokenInfo(response.data);
            return response.data;
        }
        catch (ex) {
            console.log(ex);
            return "Error during fetch of access token"
        }

    }

    const getSPYQuotes = async () => {
        const result = await axios.request({
            url: 'https://api.tdameritrade.com/v1/marketdata/SPY/quotes',
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${cache.get("access_token")}`
            },
        });
        let contentArray = ['<div><h3>Just for fun... an SPY Quote</h3><table>'];
        Object.keys(result.data.SPY).forEach(element => {
            contentArray.push(`<tr><td>${element}</td><td>${result.data.SPY[element]}</td></tr>`)
        });
        contentArray.push('</table></div>');
        return contentArray.join();
    }

    return {
        handleTDCallback,
        handleTDRefresh,
        getSPYQuotes
    }
}