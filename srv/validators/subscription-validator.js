const { generateResponse } = require("../libs/response");

const newServiceValidation = async(req, res, next) => {
    try {
        const { serviceId, serviceDesc } = req.body;

        if (!serviceId) return res.status(404).send(generateResponse("Failed", "Missing field Service ID", "B", "E", null, true, null));
        if (serviceId.length > 20) return res.status(500).send(generateResponse("Failed", "Field Service ID must not exceed 20 characters in length", "B", "E", null, true, null));
        if (!serviceDesc) return res.status(404).send(generateResponse("Failed", "Missing field Service Description", "B", "E", null, true, null));;
        if (serviceDesc.length > 100) return res.status(500).send(generateResponse("Failed", "Field Service Description must not exceed 100 characters in length", "B", "E", null, true, null));
        next();
    } catch (error) {
        debugger;
    }
};

const subscriptionPlanValidation = async(req, res, next) => {
    try {
        const { countryKey, subscriptionPlanDesc, currency } = req.body;

        if (!countryKey) return res.status(404).send(generateResponse("Failed", "Missing field Country Key", "B", "E", null, true, null));
        if (countryKey.length > 3) return res.status(500).send(generateResponse("Failed", "Field Country Key must not exceed 3 characters in length", "B", "E", null, true, null));

        if (!subscriptionPlanDesc) return res.status(404).send(generateResponse("Failed", "Missing field Subscription Plan Description", "B", "E", null, true, null));;
        if (subscriptionPlanDesc.length > 40) return res.status(500).send(generateResponse("Failed", "Field Subscription Plan Description must not exceed 40 characters in length", "B", "E", null, true, null));

        if (!currency) return res.status(404).send(generateResponse("Failed", "Missing field Currency", "B", "E", null, true, null));;
        if (currency.length > 40) return res.status(500).send(generateResponse("Failed", "Field Currency must not exceed 40 characters in length", "B", "E", null, true, null));

        next();
    } catch (error) {
        debugger;
    }
};

const subscriptionServiceValidation = async(req, res, next) => {
    try {
        const { subscriptionPlanId, serviceId, currency, rateType, rateAmount } = req.body;

        if (!subscriptionPlanId) return res.status(404).send(generateResponse("Failed", "Missing field Subscription Plan", "B", "E", null, true, null));
        if (!serviceId) return res.status(404).send(generateResponse("Failed", "Missing field Service", "B", "E", null, true, null));
        if (!currency) return res.status(404).send(generateResponse("Failed", "Missing field Currency", "B", "E", null, true, null));
        if (!rateType) return res.status(404).send(generateResponse("Failed", "Missing field Rate Type", "B", "E", null, true, null));
        if (!rateAmount) return res.status(404).send(generateResponse("Failed", "Missing field Rate Amount", "B", "E", null, true, null));

        next();
    } catch (error) {
        debugger;
    }
};

const clientValidation = async(req, res, next) => {
    try {
        const { clientName, userId, countryKey, language, currency, maxNoUsers } = req.body;
        const db = req.db;
        if (!clientName) return res.status(404).send(generateResponse("Failed", "Missing field Client Name", "B", "E", null, true, null));
        if (!userId) return res.status(404).send(generateResponse("Failed", "Missing field Client Email", "B", "E", null, true, null));
        if (!countryKey) return res.status(404).send(generateResponse("Failed", "Missing field Country", "B", "E", null, true, null));
        if (!language) return res.status(404).send(generateResponse("Failed", "Missing field Language", "B", "E", null, true, null));
        if (!currency) return res.status(404).send(generateResponse("Failed", "Missing field Currency", "B", "E", null, true, null));
        if (!maxNoUsers) return res.status(404).send(generateResponse("Failed", "Missing max number users", "B", "E", null, true, null));

        next();
    } catch (error) {

        debugger;
    }
};


module.exports = {
    newServiceValidation,
    subscriptionPlanValidation,
    subscriptionServiceValidation,
    clientValidation
};