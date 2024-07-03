const { generateResponse } = require("../libs/response");
const { validateGSTIN } = require("../gstin/validate-gstin");

const validateGstin = async (req, res, next) => {
    const { portal } = req.query;
    const { gstin } = req.body;
    if (!gstin) {
        if (portal == 'true' || portal == true) {
            return res.status(400).send(generateResponse("Failed", "GSTIN must be provided", "B", "E", null, true, null));
        } else {
            return res.status(400).send({ status: 400, message: "GSTIN must be provided" });
        }
    }
    try {
        const output = await validateGSTIN(gstin);
        if (portal == 'true' || portal == true) {
            res.status(200).response(generateResponse("Success", "GSTIN details fetched", "T", "S", null, false, output))
        } else {
            res.status(200).response(output);
        }
        next();
    } catch (error) {
        if (portal == 'true' || portal == true) {
            res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
        } else {
            res.status(500).send({ status: 500, message: error.message });
        }
    }
};

module.exports = {
    validateGstin
};