const { generateResponse } = require("../libs/response");
const { v4: uuidv4 } = require('uuid');
const { sanitizeString } = require('../utils/sanitization');
const moment = require('moment');

const createServices = async(req, res) => {
    try {
        const {
            serviceId,
            serviceDesc
        } = req.body;
        const db = req.db;
        console.log(`INSERT INTO "Services" ("serviceId","serviceDesc")
        VALUES ('${serviceId}', '${serviceDesc}')`);
        await db.exec(`UPSERT "Services" ("serviceId","serviceDesc")
                            VALUES ('${sanitizeString(serviceId).toUpperCase()}', '${sanitizeString(serviceDesc)}') 
                            WHERE "serviceId" = '${sanitizeString(serviceId).toUpperCase()}'`);


        const servicesList = await db.exec(`SELECT * FROM "Services"`);
        res.status(200).send(generateResponse("Success", "Service Created", "T", "S", null, false, servicesList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const getServices = async(req, res) => {
    const db = req.db;
    try {
        const servicesList = await db.exec(`SELECT * FROM "Services"`);
        res.status(200).send(generateResponse("Success", "Service Created", "T", "S", null, false, servicesList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const deleteService = async(req, res) => {
    try {
        const {
            serviceId
        } = req.body;
        const db = req.db;
        await db.exec(`DELETE FROM "Services" WHERE "serviceId" = '${sanitizeString(serviceId).toUpperCase()}'`);

        const servicesList = await db.exec(`SELECT * FROM "Services"`);
        res.status(200).send(generateResponse("Success", `Service "${sanitizeString(serviceId).toUpperCase()}" Deleted`, "T", "S", null, true, servicesList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const getSubscriptionPlans = async(req, res) => {
    const db = req.db;
    try {
        const subscriptionPlanList = await db.exec(`SELECT * FROM "SubscriptionPlans"`);
        res.status(200).send(generateResponse("Success", "Subscription Plans Fetched.", "T", "S", null, false, subscriptionPlanList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const createSubscriptionPlan = async(req, res) => {
    try {
        var { subscriptionPlanId, countryKey, subscriptionPlanDesc, currency, duration, isTrial, isActive } = req.body;

        let msg;
        if (!subscriptionPlanId) {
            msg = "Subscription Plans Created"
        } else {
            msg = "Subscription Plans Updated"
        }

        const db = req.db;
        if (!subscriptionPlanId) subscriptionPlanId = uuidv4();
        await db.exec(`UPSERT "SubscriptionPlans" ("subscriptionPlanId","countryKey", "subscriptionPlanDesc", "currency", "duration", "isTrial", "isActive")
                            VALUES ('${subscriptionPlanId}', '${sanitizeString(countryKey).toUpperCase()}', '${sanitizeString(subscriptionPlanDesc)}', '${sanitizeString(currency).toUpperCase()}','${sanitizeString(duration)}',${sanitizeString(isTrial)},${sanitizeString(isActive)}) 
                            WHERE "subscriptionPlanId" = '${sanitizeString(subscriptionPlanId)}'`);

        const subscriptionPlanList = await db.exec(`SELECT * FROM "SubscriptionPlans"`);
        res.status(200).send(generateResponse("Success", msg, "T", "S", null, true, subscriptionPlanList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const deleteSubscriptionPlan = async(req, res) => {
    try {
        const {
            subscriptionPlanId
        } = req.body;
        const db = req.db;
        await db.exec(`DELETE FROM "SubscriptionPlans" WHERE "subscriptionPlanId" = '${sanitizeString(subscriptionPlanId)}'`);

        const subscriptionPlan = await db.exec(`SELECT * FROM "SubscriptionPlans"`);
        res.status(200).send(generateResponse("Success", `Subscription Plan Deleted`, "T", "S", null, true, subscriptionPlan));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const getSubscriptionService = async(req, res) => {
    const db = req.db;
    try {
        const subscriptionServiceList = await db.exec(`SELECT * FROM "SubscriptionServices"`);
        const servicesList = await db.exec(`SELECT * FROM "Services"`);
        const subscriptionPlansList = await db.exec(`SELECT * FROM "SubscriptionPlans"`);
        const rateType = [
            { "rateType": "F", "rateDesc": "Fixed Rate" },
            { "rateType": "P", "rateDesc": "Periodic Rate" },
            { "rateType": "U", "rateDesc": "Unit Rate" }
        ];
        const periodType = [
            { "periodType": "D", "periodDesc": "Daily" },
            { "periodType": "M", "periodDesc": "Monthly" },
            { "periodType": "Y", "periodDesc": "Yearly" }
        ];
        var responseData = {
            "subscriptionServiceList": subscriptionServiceList,
            "servicesList": servicesList,
            "subscriptionPlansList": subscriptionPlansList,
            "rateType": rateType,
            "periodType": periodType
        }
        res.status(200).send(generateResponse("Success", "Subscription Service Fetched", "T", "S", null, false, responseData));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const createSubscriptionService = async(req, res) => {
    try {
        const { subscriptionPlanId, serviceId, currency, rateType, rateAmount, periodType, isActive } = req.body;

        let msg;
        if (!subscriptionPlanId) {
            msg = "Subscription Service Created"
        } else {
            msg = "Subscription Service Updated"
        }

        const db = req.db;
        await db.exec(`UPSERT "SubscriptionServices" 
        ("subscriptionPlanId","serviceId","currency", "rateType", "rateAmount", "periodType","isActive")
                            VALUES ('${subscriptionPlanId}','${sanitizeString(serviceId).toUpperCase()}', '${sanitizeString(currency).toUpperCase()}', '${sanitizeString(rateType).toUpperCase()}',
                            ${sanitizeString(rateAmount)}, '${sanitizeString(periodType).toUpperCase()}', ${sanitizeString(isActive)}) 
                            WHERE "subscriptionPlanId" = '${sanitizeString(subscriptionPlanId)}' 
                            AND "serviceId" = '${sanitizeString(serviceId).toUpperCase()}'`);

        const subscriptionServiceList = await db.exec(`SELECT * FROM "SubscriptionServices"`);
        res.status(200).send(generateResponse("Success", msg, "T", "S", null, true, subscriptionServiceList));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
const deleteSubscriptionService = async(req, res) => {
    try {
        const {
            subscriptionPlanId,
            serviceId
        } = req.body;
        const db = req.db;
        await db.exec(`DELETE FROM "SubscriptionServices" 
        WHERE "subscriptionPlanId" = '${sanitizeString(subscriptionPlanId)}' 
        AND "serviceId" = '${sanitizeString(serviceId).toUpperCase()}'`);
        const subscriptionPlan = await db.exec(`SELECT * FROM "SubscriptionServices"`);
        res.status(200).send(generateResponse("Success", `Subscription Plan Deleted`, "T", "S", null, true, subscriptionPlan));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
}
module.exports = {
    createServices,
    getServices,
    deleteService,
    getSubscriptionPlans,
    createSubscriptionPlan,
    deleteSubscriptionPlan,
    getSubscriptionService,
    createSubscriptionService,
    deleteSubscriptionService
};