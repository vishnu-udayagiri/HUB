const router = require('express').Router();
const { generateResponse } = require('../libs/response');

router.get("/country", async (req, res) => {
    try {
        const country = req.db.exec(`SELECT * FROM "Country"`);
        res.status(200).send(generateResponse("Success", "Country fetched", "T", "S", null, false, country));

    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
});

router.get("/currency", async (req, res) => {
    try {
        const currency = req.db.exec(`SELECT * FROM "Currency"`);
        res.status(200).send(generateResponse("Success", "Currency fetched", "T", "S", null, false, currency));
    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
});

router.get("/language", async (req, res) => {
    try {
        const language = req.db.exec(`SELECT * FROM "Language"`);
        res.status(200).send(generateResponse("Success", "Language fetched", "T", "S", null, false, language));
    } catch (error) {
        console.log(error);
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
});

module.exports = router;