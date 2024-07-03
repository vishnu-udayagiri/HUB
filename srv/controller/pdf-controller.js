const { pdfToText, newPDFToText } = require('../libs/pdf');
const { generateResponse } = require("../libs/response");

const convertPdfToText = async (req, res) => {
    try {
        const { base64File } = req.body;
        let data = await newPDFToText(base64File);
        res.status(200).send(generateResponse("Success", "Text Extracted from PDF", "T", "S", null, false, { text: data }));


    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }

};





module.exports = {
    convertPdfToText
};