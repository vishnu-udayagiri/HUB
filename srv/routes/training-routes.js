const router = require('express').Router();

const {
    createNewTemplate,
    updateTemplateField,
    createOriginator,
    getOriginators,
    getOriginatorsAndDocumentTypes,
    getDocumentTypes,
    extractFieldsInPortal,
    getTrainedFields,
    deleteTrainedFields,
    getFieldIds
} = require("../controller/template-controller");

const { newTemplateValidation } = require("../validators/template-validator");

router.post("/create-new-template", newTemplateValidation, createNewTemplate);
router.post("/update-template-field", updateTemplateField);
router.post("/create-originator", createOriginator);
router.get("/get-originators", getOriginators);
router.get("/get-document-types", getDocumentTypes);
router.post("/extract-fields-portal", extractFieldsInPortal);
router.get("/get-originators-and-document-types", getOriginatorsAndDocumentTypes);
router.post("/get-trained-fields", getTrainedFields);
router.delete("/delete-trained-fields", deleteTrainedFields);
router.get("/get-field-ids", getFieldIds);


module.exports = router;