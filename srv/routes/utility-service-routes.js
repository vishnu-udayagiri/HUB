const router = require('express').Router();

router.get("/document-types", async (req, res) => {
    try {
        const db = req.db;
        const { orginatorCode, countryKey, documentType } = req.query;
        if (!orginatorCode) return res.status(404).send("Missing Orginator code");
        if (!countryKey) return res.status(404).send("Missing Country Key");
        if (!documentType) return res.status(404).send("Missing document Type");

        const documents = await db.exec(`SELECT DISTINCT "documentSubType"
                                                FROM "DocumentTemplates"
                                                WHERE "clientId" = '${req.user.cid}' AND 
                                                "originatorCode" = '${orginatorCode}' AND 
                                                "countryKey" = '${countryKey}' AND
                                                "documentTypeCode" = '${documentType}'`);

        res.status(200).send(documents);

    } catch (error) {
        console.log(error);
        return res.status(500).send(error.message);
    }
});

module.exports = router;