const { generateResponse } = require("../libs/response");

const newTemplateValidation = async (req, res, next) => {
    try {
        const { originatorCode, documentTypeCode, documentSubType, description, countryKey } = req.body;

        if (!countryKey) return res.status(404).send(generateResponse("Failed", "Missing field Country", "B", "E", null, true, null));
        if (countryKey.length > 3) return res.status(500).send(generateResponse("Failed", "Field Originator Type must not exceed 3 characters in length", "B", "E", null, true, null));

        if (!originatorCode) return res.status(404).send(generateResponse("Failed", "Missing field Originator Code", "B", "E", null, true, null));;
        if (originatorCode.length > 20) return res.status(500).send(generateResponse("Failed", "Field Originator Code must not exceed 10 characters in length", "B", "E", null, true, null));

        if (!documentTypeCode) return res.status(404).send(generateResponse("Failed", "Missing field Document Type Code", "B", "E", null, true, null));;
        if (documentTypeCode.length > 4) return res.status(500).send(generateResponse("Failed", "Field Document Type Code must not exceed 4 characters in length", "B", "E", null, true, null));

        if (!documentSubType) return res.status(404).send(generateResponse("Failed", "Missing field Document Sub Type", "B", "E", null, true, null));;
        if (documentSubType.length > 20) return res.status(500).send(generateResponse("Failed", "Field Document Sub Type must not exceed 20 characters in length", "B", "E", null, true, null));

        next();
    } catch (error) {
        debugger;
    }
};

module.exports = {
    newTemplateValidation
};