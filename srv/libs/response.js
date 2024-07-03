const { encode } = require('js-base64');
/**
 * 
 * @param {('Success'|'Failed')} Status - Status of the response
 * @param {String} MText - Message text
 * @param {('T'|'B')} MFormat - Message format to be displayed as Toast or MessageBox
 * @param {('S'|'W'|'I'|'E')} MType - If MFormat is 'B', this is the Type of the message box
 * @param {String} [i18nCode] - i18n code for the message text
 * @param {Boolean} [MVisible=true] - If true, the message will be displayed before callback
 * @param {String} [Data] - Base64 encoded data
 * @returns {Object} - JSON Objject
 */
const generateResponse = (Status, MText, MFormat, MType, i18nCode = null, MVisible = true, Data = null) => {
    return {
        "Status": Status,
        "Message": {
            "Text": MText,
            "Type": MFormat,
            "Code": MType,
            "i18nCode": i18nCode,
            "ShowMessage": MVisible,
        },
        "Data": Data ? encode(JSON.stringify(Data)) : Data
    };
};

module.exports = {
    generateResponse
};