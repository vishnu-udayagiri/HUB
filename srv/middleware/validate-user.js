const { verifyJWT } = require('../libs/jwt');
const { encode } = require('js-base64');
const isUUID = require('validator/lib/isUUID');
const { generateResponse } = require('../libs/response');

/**
 * Validation function to validate external user with email and password 
 */
const validateUser = (req, res, next) => {
    try {
        const bearer = req.headers.authorization;
        if (!bearer) return res.status(403).send(generateResponse("Failed", "Authorization header missing", "B", "E", null, true, null));
        const token = bearer.split(" ")[1];
        if (!token) return res.status(403).send(generateResponse("Failed", "Authorization token missing", "B", "E", null, true, null));
        const decoded = verifyJWT(token);
        const { exp, iat, ...rest } = decoded;
        req.user = rest;
        next();
    } catch (error) {
        res.status(403).send(generateResponse("Failed", "Token Expired login again", "B", "E", null, true, null));
    }
};

/**
 * Validation function to validate API call with Client Id and Client Secret
 */
const validateClientSecret = async (req, res, next) => {
    try {
        const db = req.db;

        let auth = req.headers.authorization.split(" ")[1];
        if (!(auth.length > 0)) return res.status(401).send(generateResponse("Failed", "Missing authorization object", "B", "E", null, true, null));
        auth = Buffer.from(auth, 'base64').toString("ascii");
        let [clientId, clientSecret] = auth.split(":");
        if (!clientId) return res.status(401).send(generateResponse("Failed", "Client Id must be provided", "B", "E", null, true, null));
        clientId = Buffer.from(clientId, 'base64').toString("ascii");
        if (!isUUID(clientId)) return res.status(504).send(generateResponse("Failed", "Invalid Client Id", "B", "E", null, true, null));
        if (!clientSecret) return res.status(401).send(generateResponse("Failed", "Password must be provided", "B", "E", null, true, null));
        if (clientSecret.length != 32) return res.status(401).send(generateResponse("Failed", "Invalid Client Secret", "B", "E", null, true, null));
        clientSecret = encode(clientSecret);
        const client = db.exec(`SELECT COUNT(*) as "Count" FROM "HubClients" WHERE LOWER("clientId") = LOWER('${clientId}')
                                            AND "clientSecret" = '${clientSecret}'`)[0];
        if (client.Count === 1) {
            const user = {
                cid: clientId
            };
            req.user = user;
            next();
        } else {
            return res.status(403).send(generateResponse("Failed", "Invalid Client ID/Secret", "B", "E", null, true, null));
        }
    } catch (error) {
        return res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }

};

module.exports = {
    validateUser,
    validateClientSecret
};