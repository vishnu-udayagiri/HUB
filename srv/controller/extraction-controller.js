const { pdfToText } = require('../libs/pdf');
const { extractPossibleValues } = require("../utils/template");
const { generateResponse } = require("../libs/response");

const extractFieldValues = async (req, res, next) => {
    try {
        const { originatorCode, documentTypeCode, documentSubType, base64File, countryKey } = req.body;
        const clientId = req.user.cid;
        const email = req.user.email;
        const db = req.db;
        /* const result = await db.exec(`SELECT "countryKey" from "DocumentTemplates" 
                            WHERE "clientId" = '${clientId}' and
                            "originatorCode" = '${originatorCode}' and
                            "documentTypeCode" = '${documentTypeCode}' and
                            "documentSubType" = '${documentSubType}'`)[0];

        const countryKey = result?.countryKey ?? "IN"; */

        const headerFieldsTs = await db.exec(`SELECT "fieldId", "fieldTemplate" from "TemplateFields" WHERE
                                    "clientId" = '${clientId}' AND
                                    "originatorCode" = '${originatorCode}' AND
                                    "documentTypeCode" = '${documentTypeCode}' AND
                                    "documentSubType" = '${documentSubType}' AND
                                    "countryKey" = '${countryKey}' AND
                                    "isLineItem" = false`);
        const itemFieldsTs = await db.exec(`SELECT "fieldId", "fieldTemplate" from "TemplateFields" WHERE
                                    "clientId" = '${clientId}' AND
                                    "originatorCode" = '${originatorCode}' AND
                                    "documentTypeCode" = '${documentTypeCode}' AND
                                    "documentSubType" = '${documentSubType}' AND
                                    "countryKey" = '${countryKey}' AND
                                    "isLineItem" = true`);

        const data = await pdfToText(base64File);
        const headerFields = {};

        headerFieldsTs.forEach(HFT => {
            const label = HFT.fieldId;
            const template = JSON.parse(HFT.fieldTemplate);
            const fieldValue = extractPossibleValues(template.startLabel, template.endLabel, template.pattern, template.replace, data, template.index, template.isDate, template.dateFormat, template.dateToFormat);
            headerFields[label] = fieldValue;
        });

        const itemFields = {};
        const itemBodyTemplate = itemFieldsTs.find(item => item.fieldId === "LineItem");
        if (itemBodyTemplate && itemFieldsTs.length > 1) {
            const itemTemplate = JSON.parse(itemBodyTemplate.fieldTemplate);
            const itemBody = extractPossibleValues(itemTemplate.startLabel, itemTemplate.endLabel, itemTemplate.pattern, itemTemplate.replace, data, itemTemplate.index, itemTemplate.isDate, itemTemplate.dateFormat, itemTemplate.dateToFormat);
            if (itemBody) {
                let regEx = new RegExp(itemTemplate.innerPattern, 'g');
                const rows = itemBody.match(regEx);
                rows.forEach((row, index) => {
                    const items = {};
                    itemFieldsTs.forEach(IFT => {
                        if (IFT.fieldId != "LineItem") {
                            const fieldTemplate = JSON.parse(IFT.fieldTemplate);
                            const fieldLabel = IFT.fieldId;
                            let itemRegEx = new RegExp(fieldTemplate.pattern, 'g');
                            const arrField = row.match(itemRegEx);
                            let value = "";
                            if (arrField && arrField.length >= fieldTemplate.index) {
                                value = arrField[fieldTemplate.index];
                            }
                            if (fieldTemplate.replace.length) {
                                fieldTemplate.replace.forEach(replacer => {
                                    value = value.replaceAll(replacer, '');
                                });
                            }
                            items[fieldLabel] = value.trim();
                        }
                    });
                    itemFields[index] = items;
                });
            }
        }

        const output = {
            Header: headerFields,
            Items: itemFields
        };

        res.status(200).response(output);
        next();
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};


module.exports = {
    extractFieldValues
};