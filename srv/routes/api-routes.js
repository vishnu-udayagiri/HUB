const router = require('express').Router();

const { extractFieldValues } = require("../controller/extraction-controller");
const { validateGstin } = require("../controller/validation-controller");
const { extractOCR } = require("../controller/extract-ocr");
const { extractBRC } = require("../brc/brc-extractor");

router.post("/extract", extractFieldValues);
router.post("/extract-ocr", extractOCR);
router.post("/validate-gstin", validateGstin);
router.post("/brc", extractBRC);

module.exports = router;