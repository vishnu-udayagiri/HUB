const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { encode } = require('js-base64');
const keygen = require("keygenerator");
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const { generateResponse } = require("../libs/response");
const { generateJWT } = require("../libs/jwt");
const { sanitizeString } = require('../utils/sanitization');
const generator = require("generate-password");

const getClients = async(req, res) => {
    const db = req.db;
    try {
        const clientList = await db.exec(`SELECT "HC".*, "HU"."userId", "HU"."userRole" FROM "HubClients" "HC" INNER JOIN "HubUsers" "HU" ON "HC"."clientId" = "HU"."clientId"`);
        const subscriptionPlansList = await db.exec(`SELECT * FROM "SubscriptionPlans"`);
        const blockReason = [{
            "blockReasonCode": "IB",
            "blockReasonDesc": "Insufficient Balance"
        }];
        const userRole = [{
                "userRoleId": "A",
                "userRoleDesc": "Admin"
            }, {
                "userRoleId": "N",
                "userRoleDesc": "Normal User"
            },
            {
                "userRoleId": "T",
                "userRoleDesc": "Technical User"
            }
        ]
        var responseData = {
            "clientList": clientList,
            "subscriptionPlansList": subscriptionPlansList,
            "blockReason": blockReason,
            "userRole": userRole
        }
        res.status(200).send(generateResponse("Success", "Hub Clients Fetched.", "T", "S", null, false, responseData));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const createClient = async(req, res) => {
    try {
        let {
            clientId,
            clientName,
            clientSecret,
            userId,
            clientCode,
            countryKey,
            language,
            currency,
            thresholdAmount,
            maxNoUsers,
            logo,
            isBlocked,
            blockReason,
            userRole,
            isUpdate
        } = req.body;

        const db = req.db;
        if (!clientId) clientId = uuidv4();
        const key = keygen._({
            chars: true,
            sticks: false,
            numbers: true,
            specials: false,
            length: 22,
            forceUppercase: false,
            forceLowercase: false,
        });
        if (!thresholdAmount) thresholdAmount = 0;
        if (!logo) logo = '';

        await db.exec(`UPSERT "HubClients" ("clientId","clientName","clientSecret","clientCode","countryKey","language",
        "currency","thresholdAmount","maxNoUsers","logo","isBlocked","blockReason")
         VALUES ('${sanitizeString(clientId)}', '${sanitizeString(clientName)}','${encode(encode(key))}', '${sanitizeString(clientCode).toUpperCase()}', '${sanitizeString(countryKey).toUpperCase()}', '${sanitizeString(language).toUpperCase()}',
                 '${sanitizeString(currency).toUpperCase()}', '${thresholdAmount}', ${sanitizeString(maxNoUsers)}, '${logo}', ${sanitizeString(isBlocked)}, '${sanitizeString(blockReason)}' 
                 ) WHERE "clientId" = '${sanitizeString(clientId)}'`);
        var msg;
        if (sanitizeString(isUpdate)) {
            msg = "User Updated";
        } else {
            const password = generator.generate({
                length: 10,
                numbers: true,
            });
            const hashPassword = await bcrypt.hash(password, 12);
            if (!userRole) userRole = 'A';
            await db.exec(`UPSERT "HubUsers" ("userId","clientId","userName","password","userRole")
                                    VALUES ('${userId}','${clientId}','${userId}','${hashPassword}','${userRole}') WHERE "userId" = '${sanitizeString(userId)}'`);

            msg = "User Created";
            /** TODO: Trigger Mail to vendor */
        }
        const clientList = await db.exec(`SELECT "HC".*,"HU"."userId" FROM "HubClients" "HC" INNER JOIN "HubUsers" "HU" ON "HC"."clientId" = "HU"."clientId"`);
        res.status(200).send(generateResponse("Success", msg, "T", "S", null, true, clientList));

    } catch (error) {
        return res.status(500).send(error.message);
    }
};
const deleteClient = async(req, res) => {
    try {
        const {
            clientId
        } = req.body;
        const db = req.db;
        await db.exec(`DELETE FROM "HubClients" WHERE "clientId" = '${sanitizeString(clientId)}'`);
        const hubClients = await db.exec(`SELECT * FROM "HubClients"`);
        res.status(200).send(generateResponse("Success", `Client Deleted`, "T", "S", null, true, hubClients));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
}
module.exports = {
    getClients,
    createClient,
    deleteClient
};