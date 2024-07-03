const { newPDFToText } = require("../libs/pdf");
const { generateResponse } = require("../libs/response");

const regexes = [
    {
        field: "firmName",
        regex: "(?:1\\s*)(?:F\\s*i\\s*r\\s*m\\s*'\\s*s\\s*N\\s*a\\s*m\\s*e\\s*)(.*)(?:\\s*2\\s*A\\s*d\\s*d\\s*r\\s*e\\s*s\\s*s\\s*)"
    },
    {
        field: "address",
        regex: "(?:2\\s*)(?:A\\s*d\\s*d\\s*r\\s*e\\s*s\\s*s\\s*)(.*)(?:\\s*3\\s*I\\s*E\\s*C\\s*)"
    },
    {
        field: "iec",
        regex: "(?:3\\s*)(?:I\\s*E\\s*C\\s*)(.*)(?:\\s*4\\s*S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*)"
    },
    {
        field: "shippingBillNo",
        regex: "(?:4\\s*)(?:S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*\\s*B\\s*i\\s*l\\s*l\\s*\\s*N\\s*o\\s*)(.*)(?:\\s*5\\s*S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*\\s*B\\s*i\\s*l\\s*l\\s*\\s*D\\s*a\\s*t\\s*e\\s*)"
    },
    {
        field: "shippingBillDate",
        regex: "(?:5\\s*)(?:S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*\\s*B\\s*i\\s*l\\s*l\\s*\\s*D\\s*a\\s*t\\s*e\\s*)(.*)(?:\\s*6\\s*S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*\\s*B\\s*i\\s*l\\s*l\\s*\\s*P\\s*o\\s*r\\s*t\\s*)"
    },
    {
        field: "shippingBillPort",
        regex: "(?:6\\s*)(?:S\\s*h\\s*i\\s*p\\s*p\\s*i\\s*n\\s*g\\s*\\s*B\\s*i\\s*l\\s*l\\s*\\s*P\\s*o\\s*r\\s*t\\s*)(.*)(?:\\s*7\\s*B\\s*a\\s*n\\s*k\\s*'\\s*s\\s*N\\s*a\\s*m\\s*e\\s*)"
    },
    {
        field: "bankName",
        regex: "(?:7\\s*)(?:B\\s*a\\s*n\\s*k\\s*'\\s*s\\s*N\\s*a\\s*m\\s*e\\s*)(.*)(?:\\s*8\\s*B\\s*a\\s*n\\s*k\\s*)"
    },
    {
        field: "bankFileNoAndDate",
        regex: "(?:8\\s*B\\s*a\\s*n\\s*k\\s*'\\s*s\\s*F\\s*i\\s*l\\s*e\\s*\\s*n\\s*o\\s*\\s*a\\s*n\\s*d\\s*\\s*U\\s*p\\s*l\\s*o\\s*a\\s*d\\s*e{0,1}\\s*d{0,1}\\s*D\\s*a\\s*t\\s*e\\s*)(.*)(?:9\\s*b\\s*i\\s*l\\s*l\\s*)"
    },
    {
        field: "billIdNo",
        regex: "(?:9\\s*)(?:B\\s*i\\s*l\\s*l\\s*\\s*I\\s*D\\s*\\s*n\\s*o\\s*)(.*)(?:1\\s*0\\s*B\\s*a\\s*n\\s*k\\s*r\\s*e)"
    },
    {
        field: "bankRealisationCertificateNo",
        regex: "(?:1\\s*0\\s*b{0,1}\\s*a{0,1}\\s*n{0,1}\\s*k{0,1}\\s*r{0,1}\\s*e{0,1}\\s*a{0,1}\\s*l{0,1}\\s*i{0,1}\\s*s{0,1}\\s*a{0,1}\\s*t{0,1}\\s*i{0,1}\\s*o{0,1}\\s*n{0,1}\\s*c{0,1}\\s*e{0,1}\\s*r{0,1}\\s*t{0,1}\\s*i{0,1}\\s*f{0,1}\\s*i{0,1}\\s*c{0,1}\\s*a{0,1}\\s*t{0,1}\\s*e{0,1}\\s*n{0,1}\\s*o{0,1}\\s*)(\\w{20})(?:\\s*D\\s*a\\s*t\\s*e\\s*d)"
    },
    {
        field: "bankRealisationCertificateDate",
        regex: "(?:1\\s*0\\s*b{0,1}\\s*a{0,1}\\s*n{0,1}\\s*k{0,1}\\s*r{0,1}\\s*e{0,1}\\s*a{0,1}\\s*l{0,1}\\s*i{0,1}\\s*s{0,1}\\s*a{0,1}\\s*t{0,1}\\s*i{0,1}\\s*o{0,1}\\s*n{0,1}\\s*c{0,1}\\s*e{0,1}\\s*r{0,1}\\s*t{0,1}\\s*i{0,1}\\s*f{0,1}\\s*i{0,1}\\s*c{0,1}\\s*a{0,1}\\s*t{0,1}\\s*e{0,1}\\s*n{0,1}\\s*o{0,1}\\s*\\w{20}\\s*D\\s*a\\s*t\\s*e\\s*d\\s*)(\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}\\.\\d{1,2}\\.\\d{4})(?:\\s*1\\s*1\\s*d\\s*a\\s*t\\s*e)"
    },
    {
        field: "dateOfRealisationOfMoneyByBank",
        regex: "(?:1\\s*1\\s*D{0,1}\\s*a{0,1}\\s*t{0,1}\\s*e{0,1}\\s*o{0,1}\\s*f{0,1}\\s*r{0,1}\\s*e{0,1}\\s*a{0,1}\\s*l{0,1}\\s*i{0,1}\\s*s{0,1}\\s*a{0,1}\\s*t{0,1}\\s*i{0,1}\\s*o{0,1}\\s*n{0,1}\\s*o{0,1}\\s*f{0,1}\\s*m{0,1}\\s*o{0,1}\\s*n{0,1}\\s*e{0,1}\\s*y{0,1}\\s*b{0,1}\\s*y{0,1}\\s*b{0,1}\\s*a{0,1}\\s*n{0,1}\\s*k{0,1}\\s*)(\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}\\.\\d{1,2}\\.\\d{4})(?:\\s*1\\s*2)"
    },
    {
        field: "realisedValueInForeignCurrency",
        regex: "(?:1\\s*2\\s*R{0,1}\\s*e{0,1}\\s*a{0,1}\\s*l{0,1}\\s*i{0,1}\\s*s{0,1}\\s*e{0,1}\\s*d{0,1}\\s*v{0,1}\\s*a{0,1}\\s*l{0,1}\\s*u{0,1}\\s*e{0,1}\\s*i{0,1}\\s*n{0,1}\\s*F{0,1}\\s*o{0,1}\\s*r{0,1}\\s*e{0,1}\\s*i{0,1}\\s*g{0,1}\\s*n{0,1}\\s*C{0,1}\\s*u{0,1}\\s*r{0,1}\\s*r{0,1}\\s*e{0,1}\\s*n{0,1}\\s*c{0,1}\\s*y{0,1}\\s*)(\\d{1,20}.\\d{1,3})(?:\\s*1\\s*3)"
    },
    {
        field: "currencyOfRealisation",
        regex: "(?:1\\s*3\\s*C{0,1}\\s*u{0,1}\\s*r{0,1}\\s*r{0,1}\\s*e{0,1}\\s*n{0,1}\\s*c{0,1}\\s*y{0,1}\\s*o{0,1}\\s*f{0,1}\\s*R{0,1}\\s*e{0,1}\\s*a{0,1}\\s*l{0,1}\\s*i{0,1}\\s*s{0,1}\\s*a{0,1}\\s*t{0,1}\\s*i{0,1}\\s*o{0,1}\\s*n{0,1}\\s*)(\\w{1,3})(?:\\s*1\\s*4)"
    },
    {
        field: "dateAndTimeOfPrinting",
        regex: "(?:1\\s*4\\s*D\\s*a{0,1}\\s*t{0,1}\\s*e{0,1}\\s*&{0,1}\\s*t{0,1}\\s*i{0,1}\\s*m{0,1}\\s*e{0,1}\\s*o{0,1}\\s*f{0,1}\\s*p{0,1}\\s*r{0,1}\\s*i{0,1}\\s*n{0,1}\\s*t{0,1}\\s*i{0,1}\\s*n{0,1}\\s*g{0,1}\\s*)(.*)(?:A\\s*b\\s*o\\s*u\\s*t)"
    }
];

const extractBRC = async (req, res, next) => {
    const { portal } = req.query;
    const { data } = req.body;
    if (!data) {
        if (portal == 'true' || portal == true) {
            return res.status(400).send(generateResponse("Failed", "Base64 string of pdf must be provided", "B", "E", null, true, null));
        } else {
            return res.status(400).send({ status: 400, message: "Base64 string of pdf must be provided" });
        }
    }
    try {
        const text = await newPDFToText(data);
        const output = await extractPdf(text);
        if (portal == 'true' || portal == true) {
            res.status(200).response(generateResponse("Success", "Data extracted", "T", "S", null, false, output))
        } else {
            res.status(200).response(output);
        }
        next();
    } catch (error) {
        console.log(error);
        if (portal == 'true' || portal == true) {
            res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
        } else {
            res.status(500).send({ status: 500, message: error.message });
        }
    }
};

const extractPdf = async (text) => {
    const output = {};
    for (let i = 0; i < regexes.length; i++) {
        const regexObj = regexes[i];
        const regex = new RegExp(regexObj.regex, 'gmi');
        try {
            const matches = regex.exec(text);
            if (matches) {
                output[regexObj.field] = matches[1].trim();
            } else {
                output[regexObj.field] = "";
            }
        } catch (e) {
            console.log(e);
            output[regexObj.field] = "";
        }
    }
    return output;
};

module.exports = {
    extractBRC
}
