const { decode, encode } = require('js-base64');
const querystring = require('querystring');
const { v4: uuidv4 } = require('uuid');

const { generateResponse } = require('../libs/response');
const { generateString } = require('../utils/generator');

const getClientIdAndSecret = async(req, res) => {
    try {
        const db = req.db;
        const { cid } = req.user;

        let { clientId, clientSecret, clientName, countryKey } = await db.exec(`SELECT "clientId","clientSecret","clientName","countryKey" FROM "HubClients" WHERE LOWER("clientId") = LOWER('${cid}')`)[0];
        let { email: userEmail, name: userName, role } = req.user;
        clientId = Buffer.from(clientId).toString('base64');
        clientSecret = decode(clientSecret);
        res.status(200).send(generateResponse("Success", "Client Id and Secret fetched", "T", "S", null, false, { clientId, clientSecret, clientName, countryKey, userEmail, userName, role }));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const reGenerateCredential = async(req, res) => {
    try {
        const { role, cid } = req.user;
        if (role != 'A') return res.status(401).send(generateResponse("Failed", "Unauthorized: Need to be a Admin", "B", "E", null, true, null));
        const key = generateString({ length: 22 });
        const db = req.db;
        await db.exec(`UPDATE "HubClients" SET "clientSecret" = '${encode(encode(key))}'
                                    WHERE LOWER("clientId") = LOWER('${cid}')`);
        let { clientId, clientSecret, clientName, countryKey } = await db.exec(`SELECT "clientId","clientSecret","clientName","countryKey" FROM "HubClients" WHERE LOWER("clientId") = LOWER('${cid}')`)[0];
        let { email: userEmail, name: userName } = req.user;
        clientId = Buffer.from(clientId).toString('base64');
        clientSecret = decode(clientSecret);
        return res.status(200).send(generateResponse("Success", "Client Secret Regenerated", "T", "S", null, false, { clientId, clientSecret, clientName, countryKey, userEmail, userName, role }));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const createShortUrl = async(req, res) => {
    try {
        const { longUrl } = req.body;

        let key = generateString()

        const SHORT_URL_HOST = process.env.SHORT_URL_HOST;
        const db = req.db;
        // check if key already exists if so loop and regenerate key untill its unique
        let result = await db.exec(`SELECT "shortUrlKey" FROM "ShortUrl" WHERE "shortUrlKey" = '${key}'`);
        while (result.length > 0) {
            key = generateString();
            result = await db.exec(`SELECT "shortUrlKey" FROM "ShortUrl" WHERE "shortUrlKey" = '${key}'`);
        }

        const shortUrl = `${SHORT_URL_HOST}/us/${key}`;

        await db.exec(`INSERT INTO "ShortUrl" VALUES(
            '${uuidv4()}'/*Id <NVARCHAR(36)>*/,
            '${req.user.cid}'/*clientId <NVARCHAR(36)>*/,
            '${key}'/*shortUrlKey <NVARCHAR(7)>*/,
            '${shortUrl}'/*shortUrl <NVARCHAR(100)>*/,
            '${longUrl}'/*longUrl <NVARCHAR(2000)>*/,
            CURRENT_TIMESTAMP/*createdDate <TIMESTAMP>*/,
            '${req.user.email}'/*createdBy <NVARCHAR(241)>*/,
            true/*active <BOOLEAN>*/
        )`);

        const output = {
            shortUrl,
            longUrl,
            active: true,
        }

        return res.status(200).send(generateResponse("Success", "Short Url Created", "T", "S", null, false, output));
    } catch (error) {
        return res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
}

const urlRedirect = async(req, res) => {
    try {
        const { key } = req.params;
        const db = req.db;
        const result = await db.exec(`SELECT "longUrl" FROM "ShortUrl" WHERE "shortUrlKey" = '${key}' AND "active" = true`);
        if (result.length == 0) {
            res.status(404).sendFile('404.html', { root: './public' });
        } else {
            const { longUrl } = result[0];
            // decode longUrl from base64
            const decodedLongUrl = decode(longUrl);
            // parse query string from decoded longUrl
            const parsedLongUrl = querystring.unescape(decodedLongUrl);
            res.redirect(parsedLongUrl);
        }
    } catch (error) {
        res.status(404).sendFile('404.html', { root: './public' });
    }
}

const getUrlData = async(req, res) => {
    const { role, cid } = req.user;
    const db = req.db;
    try {
        let result = await db.exec(`SELECT "Id","longUrl","shortUrl","shortUrlKey","active" FROM "ShortUrl" WHERE "clientId" = '${cid}'`);
        for (let i = 0; i < result.length; i++) {
            const element = result[i];
            element.longUrl = atob(element.longUrl);
        }
        return res.status(200).send(generateResponse("Success", "Short URL Fetched ", "T", "S", null, false, result));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
}

const updateUrlState = async(req, res) => {
    const db = req.db;
    const { Id, active } = req.body;
    try {
        await db.exec(`UPDATE "ShortUrl" SET "active" = ${active}
                                    WHERE LOWER("Id") = LOWER('${Id}')`);
        return res.status(200).send(generateResponse("Success", "URL State Updated", "T", "S", null, false, {}));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
}
const deleteShortenedUrl = async(req, res) => {
    const db = req.db;
    const { Id } = req.body;
    try {
        await db.exec(`DELETE from "ShortUrl" WHERE LOWER("Id") = LOWER('${Id}')`);
        return res.status(200).send(generateResponse("Success", "URL State Deleted", "T", "S", null, false, {}));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
}
module.exports = {
    getClientIdAndSecret,
    reGenerateCredential,
    createShortUrl,
    urlRedirect,
    getUrlData,
    updateUrlState,
    deleteShortenedUrl
};