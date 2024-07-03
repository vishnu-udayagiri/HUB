const router = require('express').Router();

const { getPossibleValues, getPossibleItemValues } = require("../controller/template-controller");
const { convertPdfToText } = require("../controller/pdf-controller");
const { extractFieldValues } = require("../controller/extraction-controller");


router.post("/convert-pdf-to-text", convertPdfToText);
router.post("/extract-header-values", getPossibleValues);
router.post("/extract-item-values", getPossibleItemValues);

module.exports = router;