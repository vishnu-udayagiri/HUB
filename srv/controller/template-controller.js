const { escapeSingleQuotes } = require("@sap/hdbext").sqlInjectionUtils;
const { sanitizeString } = require("../utils/sanitization");
const { generateResponse } = require("../libs/response");
const { extractPossibleValues } = require("../utils/template");
const { pdfToText } = require('../libs/pdf');

/**
 * Create Originator
 */
const createOriginator = async (req, res) => {
    try {
        const { originatorCode, originatorName, countryKey, email } = req.body;
        const clientId = req.user.cid;
        const db = req.db;
        const orginator = await db.exec(`SELECT COUNT(*) as "Count" FROM "Originators" 
                        WHERE "clientId" = '${clientId}' 
                        AND "originatorCode" = '${originatorCode}'`);
        if (orginator[0].Count != 0) return res.status(403).send(generateResponse("Failed", "Originator Code already maintained", "B", "E", null, true, null));
        await db.exec(`INSERT INTO "Originators" VALUES 
                    ('${clientId}','${originatorCode.toUpperCase()}',
                    '${countryKey}',
                    '${originatorName}','${email}')`);
        res.status(201).send(generateResponse("Success", "Originator Created", "T", "S", null, true, null));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};
/**
 * Create new template
 */
const createNewTemplate = async (req, res) => {
    try {
        const { originatorCode, documentTypeCode, documentSubType, description, countryKey } = req.body;
        const clientId = req.user.cid;
        const email = req.user.email;
        const db = req.db;
        const documentTemplates = await db.exec(`SELECT COUNT(*) as "Count" FROM "DocumentTemplates" 
                        WHERE "clientId" = '${clientId}' 
                        AND "originatorCode" = '${originatorCode}'
                        AND "documentTypeCode" = '${documentTypeCode}'
                        AND "documentSubType" = '${documentSubType}'`);
        if (documentTemplates[0].Count != 0) return res.status(403).send(generateResponse("Failed", "Document Template already exists", "B", "E", null, true, null));
        await db.exec(`INSERT INTO "DocumentTemplates" VALUES 
                    ('${clientId}','${originatorCode}',
                    '${documentTypeCode}','${documentSubType}',
                    '${countryKey}',
                    '${sanitizeString(description)}',
                    CURRENT_TIMESTAMP,'${email}','N')`);
        res.status(201).send(generateResponse("Success", "Template Created", "T", "S", null, true, null));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const updateTemplateField = async (req, res) => {
    try {
        const { originatorCode, documentTypeCode,
            documentSubType, fieldId, isLineItem, description = "", fieldTemplate } = req.body;

        const template = {
            startLabel: fieldTemplate.startLabel,
            endLabel: fieldTemplate.endLabel,
            pattern: fieldTemplate.pattern,
            index: fieldTemplate.index,
            replace: fieldTemplate?.replace?.length ? fieldTemplate.replace : [],
        };
        if (fieldTemplate.isDate) {
            template.isDate = true;
            template.dateFormat = fieldTemplate.dateFormat;
            template.dateToFormat = fieldTemplate.dateToFormat;
        } else {
            template.isDate = false;
            template.dateFormat = "";
            template.dateToFormat = "";
        }
        if (fieldTemplate.innerPattern) template.innerPattern = fieldTemplate.innerPattern;
        const templateString = escapeSingleQuotes(JSON.stringify(template));
        const clientId = req.user.cid;
        const email = req.user.email;
        const db = req.db;
        const result = await db.exec(`SELECT "countryKey" from "DocumentTemplates" 
                            WHERE "clientId" = '${clientId}' and
                            "originatorCode" = '${originatorCode}' and
                            "documentTypeCode" = '${documentTypeCode}' and
                            "documentSubType" = '${documentSubType}'`)[0];
        const countryKey = result?.countryKey ?? "IN";
        await db.exec(`UPSERT "TemplateFields" VALUES(
            '${clientId}'/*clientId <NVARCHAR(36)>*/,
            '${originatorCode}'/*originatorCode <NVARCHAR(10)>*/,
            '${documentTypeCode}'/*documentTypeCode <NVARCHAR(4)>*/,
            '${documentSubType}'/*documentSubType <NVARCHAR(20)>*/,
            '${countryKey}'/*countryKey <NVARCHAR(3)>*/,
            '${fieldId}'/*fieldId <NVARCHAR(30)>*/,
            '${sanitizeString(description)}'/*description <NVARCHAR(100)>*/,
            '${templateString}'/*fieldTemplate <NVARCHAR(5000)>*/,
             ${isLineItem}/*isLineItem <BOOLEAN>*/,
            CURRENT_TIMESTAMP/*lastChangedOn <DATE>*/,
            '${email}'/*lastChangedBy <NVARCHAR(241)>*/
        ) WHERE "clientId" = '${clientId}' AND
                "originatorCode" = '${originatorCode}' AND
                "documentTypeCode" = '${documentTypeCode}' AND
                "documentSubType" = '${documentSubType}' AND
                "fieldId" = '${fieldId}'
        `);
        res.status(201).send(generateResponse("Success", "Field template updated/created", "T", "S", null, false, null));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

/**
 * Extract possible values from the source based on start label, end label,pattern 
 */
const getPossibleValues = async (req, res) => {
    try {
        const { startLabel,
            endLabel,
            pattern,
            replace,
            text, isDate,
            dateFormat,
            dateToFormat } = req.body;

        const output = extractPossibleValues(startLabel, endLabel, pattern, replace, text, null, isDate, dateFormat, dateToFormat);
        res.status(200).send(generateResponse("Success", "Here are the possible values based on start and end label and the provided pattern", "T", "S", null, false, output));

    } catch (error) {
        debugger;
    }

};

const getPossibleItemValues = async (req, res) => {
    try {
        const db = req.db;

        const clientId = req.user.cid;
        const email = req.user.email;
        const { originatorCode, documentTypeCode, documentSubType,
            startLabel, endLabel, pattern, text } = req.body;
        const itemTemplate = await db.exec(`SELECT "fieldTemplate" from "TemplateFields" WHERE
                                                    "clientId" = '${clientId}' AND
                                                    "originatorCode" = '${originatorCode}' AND
                                                    "documentTypeCode" = '${documentTypeCode}' AND
                                                    "documentSubType" = '${documentSubType}' AND
                                                    "fieldId" = 'LineItem'`);
        if (!(itemTemplate.length > 0)) return res.status(200).send(generateResponse("Failed", "Line Item field template must be maintained before training item level fields", "B", "E", null, true, undefined));
        const { startLabel: tsl, endLabel: tel, pattern: tPattern, replace: tReplace, index: tIndex, innerPattern: tInnerPattern } = JSON.parse(itemTemplate[0].fieldTemplate);
        const itemString = extractPossibleValues(tsl, tel, tPattern, tReplace, text, tIndex);
        let regEx = new RegExp(tInnerPattern, 'g');
        const items = itemString.match(regEx);
        const possibleResults = {};
        items.forEach((item, index) => {
            const values = [];

            let itemReEx = new RegExp(pattern, 'g');
            const arrField = item.match(itemReEx);
            if (arrField) {
                arrField.forEach(field => {
                    if (field) {
                        values.push({
                            index: values.length,
                            value: field.trim()
                        });
                    }
                });
            }
            possibleResults[`${index}`] = values;

        });
        res.status(200).send(generateResponse("Success", "Here are the possible item values", "T", "S", null, false, possibleResults));
        // debugger;
    } catch (error) {
        debugger;
    }

};

const getOriginatorsAndDocumentTypes = async (req, res) => {
    try {
        const db = req.db;
        const { cid } = req.user;
        const originators = await db.exec(`SELECT "originatorCode","originatorName" 
                                                    FROM "Originators" WHERE "clientId" = '${cid}'`);

        let output = {
            originators,
            "documentTypes": [
                {
                    "documentTypeCode": "SINV",
                    "documentTypeName": "Supplier Invoice"
                },
                {
                    "documentTypeCode": "CINV",
                    "documentTypeName": "Customer Invoice"
                }
            ],
            "documentSubTypes": [
                {
                    "documentTypeCode": "SINV",
                    "documentSubType": "Material",
                    "documentSubName": "Material"
                },
                {
                    "documentTypeCode": "SINV",
                    "documentSubType": "Service",
                    "documentSubName": "Service"
                },
                {
                    "documentTypeCode": "CINV",
                    "documentSubType": "Material",
                    "documentSubName": "Material"
                },
                {
                    "documentTypeCode": "CINV",
                    "documentSubType": "Service",
                    "documentSubName": "Service"
                }
            ]
        };
        res.status(200).send(generateResponse("Success", "Originators, Document Types and Document Subtypes fetched", "T", "S", null, false, output));
    } catch (error) {
        res.status(500).send(generateResponse("500", "FAILED", error.message, null));
    }
};

const getOriginators = async (req, res) => {
    try {
        const db = req.db;
        const { cid } = req.user;
        const originators = await db.exec(`SELECT "originatorCode","originatorName" 
                                                    FROM "Originators" WHERE "clientId" = '${cid}'`);

        res.status(200).send(generateResponse("Success", "Originators fetched", "T", "S", null, false, originators));
    } catch (error) {
        res.status(500).send(generateResponse("500", "FAILED", error.message, null));
    }
};

const getDocumentTypes = async (req, res) => {
    try {
        const { originator } = req.query;
        const { cid } = req.user;
        const db = req.db;
        let output;
        if (originator) {
            let documentTypes = await db.exec(`SELECT D."documentTypeCode", T."documentTypeName"
                                    FROM "DocumentTemplates" D
                                    JOIN "DocumentTypes" T on 
                                    T."documentTypeCode" = D."documentTypeCode" WHERE D."originatorCode" = '${originator}' 
                                    AND D."clientId" = '${cid}'`);

            let documentSubTypes = await db.exec(`SELECT "documentTypeCode","documentSubType","documentSubType" as "documentSubName"
                                            FROM "DocumentTemplates"  WHERE "originatorCode" = '${originator}' AND "clientId" = '${cid}'`);

            output = {
                documentTypes,
                documentSubTypes
            };
        } else {
            output = {
                "documentTypes": [
                    {
                        "documentTypeCode": "SINV",
                        "documentTypeName": "Supplier Invoice"
                    },
                    {
                        "documentTypeCode": "CINV",
                        "documentTypeName": "Customer Invoice"
                    }
                ],
                "documentSubTypes": [
                    {
                        "documentTypeCode": "SINV",
                        "documentSubType": "Material",
                        "documentSubName": "Material"
                    },
                    {
                        "documentTypeCode": "SINV",
                        "documentSubType": "Service",
                        "documentSubName": "Service"
                    },
                    {
                        "documentTypeCode": "CINV",
                        "documentSubType": "Material",
                        "documentSubName": "Material"
                    },
                    {
                        "documentTypeCode": "CINV",
                        "documentSubType": "Service",
                        "documentSubName": "Service"
                    }
                ]
            };
        }
        res.status(200).send(generateResponse("Success", "Document Types and Document Subtypes fetched", "T", "S", null, false, output));
    } catch (error) {
        res.status(500).send(generateResponse("500", "FAILED", error.message, null));
    }
};

const extractFieldsInPortal = async (req, res) => {
    try {
        const { originatorCode, documentTypeCode, documentSubType, base64File } = req.body;
        const clientId = req.user.cid;
        const email = req.user.email;
        const db = req.db;
        const result = await db.exec(`SELECT "countryKey" from "DocumentTemplates" 
                            WHERE "clientId" = '${clientId}' and
                            "originatorCode" = '${originatorCode}' and
                            "documentTypeCode" = '${documentTypeCode}' and
                            "documentSubType" = '${documentSubType}'`)[0];

        const countryKey = result?.countryKey ?? "IN";

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
            const fieldValue = extractPossibleValues(template.startLabel, template.endLabel, template.pattern, template.replace, data, template.index);
            headerFields[label] = fieldValue;
        });

        const itemFields = {};
        const itemBodyTemplate = itemFieldsTs.find(item => item.fieldId === "LineItem");
        if (itemBodyTemplate && itemFieldsTs.length > 1) {
            const itemTemplate = JSON.parse(itemBodyTemplate.fieldTemplate);
            const itemBody = extractPossibleValues(itemTemplate.startLabel, itemTemplate.endLabel, itemTemplate.pattern, itemTemplate.replace, data, itemTemplate.index);
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

        res.status(200).send(generateResponse("Success", `Fields extracted for ${originatorCode}`, "T", "S", null, false, output));

    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const getTrainedFields = async (req, res) => {
    try {
        const db = req.db;
        const { originatorCode,
            documentTypeCode,
            documentSubType } = req.body;
        const clientId = req.user.cid;
        const result = await db.exec(`SELECT "countryKey" from "DocumentTemplates" 
                            WHERE "clientId" = '${clientId}' and
                            "originatorCode" = '${originatorCode}' and
                            "documentTypeCode" = '${documentTypeCode}' and
                            "documentSubType" = '${documentSubType}'`)[0];

        const countryKey = result?.countryKey ?? "IN";

        const output = await db.exec(`SELECT "fieldId", "description","fieldTemplate","isLineItem" from "TemplateFields" WHERE
                                    "clientId" = '${clientId}' AND
                                    "originatorCode" = '${originatorCode}' AND
                                    "documentTypeCode" = '${documentTypeCode}' AND
                                    "documentSubType" = '${documentSubType}' AND
                                    "countryKey" = '${countryKey}'`);

        res.status(200).send(generateResponse("Success", `Trained fields fetched`, "T", "S", null, false, output));
    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const deleteTrainedFields = async (req, res) => {
    try {
        const db = req.db;
        const {
            originatorCode,
            documentTypeCode,
            documentSubType,
            fieldId } = req.body;

        const clientId = req.user.cid;

        await db.exec(`DELETE FROM "TemplateFields" 
                            WHERE "clientId" = '${clientId}' and
                            "originatorCode" = '${originatorCode}' and
                            "documentTypeCode" = '${documentTypeCode}' and
                            "documentSubType" = '${documentSubType}' and "fieldId" = '${fieldId}'`);
        return res.status(200).send(generateResponse("Success", `Trained fields deleted`, "T", "S", null, true, null));


    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

const getFieldIds = async (req, res) => {
    try {
        const fields = [
            {
                "fieldId": "SellerName",
                "description": "Seller Name"
            },
            {
                "fieldId": "SellerVat",
                "description": "Seller Reg no"
            },
            {
                "fieldId": "SellerStateCode",
                "description": "Seller State Code"
            },
            {
                "fieldId": "SellerPan",
                "description": "Seller PAN"
            },
            {
                "fieldId": "InvoiceNumber",
                "description": "Invoice Number"
            },
            {
                "fieldId": "InvoiceDate",
                "description": "Invoice Date"
            },
            {
                "fieldId": "PurchaseOrderNo",
                "description": "Purchase Order No"
            },
            {
                "fieldId": "BuyerVat",
                "description": "Buyer registration number"
            },
            {
                "fieldId": "BuyerStateCode",
                "description": "Buyer State Code"
            },
            {
                "fieldId": "SellerPin",
                "description": "Seller Pin code"
            },
            {
                "fieldId": "InvoiceAmount",
                "description": "Invoice Amount"
            },
            {
                "fieldId": "LineItem",
                "description": "Pattern to get the whole item"
            },
            {
                "fieldId": "ItemNo",
                "description": "Item no"
            },
            {
                "fieldId": "ProductCode",
                "description": "Product Code"
            },
            {
                "fieldId": "HsnSac",
                "description": "HSN/SAC code"
            },
            {
                "fieldId": "ItemName",
                "description": "ItemName"
            },
            {
                "fieldId": "Quantity",
                "description": "Quantity"
            },
            {
                "fieldId": "UOM",
                "description": "Unit of measure"
            },
            {
                "fieldId": "Price",
                "description": "Price"
            },
            {
                "fieldId": "GrossAmount",
                "description": "Gross Amount"
            },
            {
                "fieldId": "CGSTRate",
                "description": "CGST Rate"
            },
            {
                "fieldId": "CGSTAmount",
                "description": "CGST Amount"
            },
            {
                "fieldId": "SGSTRate",
                "description": "SGST Rate"
            },
            {
                "fieldId": "SGSTAmount",
                "description": "SGST Amount"
            },
            {
                "fieldId": "IGSTRate",
                "description": "SGST Rate"
            },
            {
                "fieldId": "IGSTAmount",
                "description": "IGST Amount"
            },
            {
                "fieldId": "ShipAddress",
                "description": "Shipping address"
            },
            {
                "fieldId": "ShipCity",
                "description": "Shipping City"
            },
            {
                "fieldId": "ShipPin",
                "description": "Shipping Postal Code"
            }
        ];
        return res.status(200).send(generateResponse("Success", `Trained fields deleted`, "T", "S", null, false, fields));

    } catch (error) {
        res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

module.exports = {
    createNewTemplate,
    getPossibleValues,
    updateTemplateField,
    getPossibleItemValues,
    createOriginator,
    getDocumentTypes,
    getOriginatorsAndDocumentTypes,
    extractFieldsInPortal,
    getOriginators,
    getTrainedFields,
    deleteTrainedFields,
    getFieldIds
};


