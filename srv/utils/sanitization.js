const { escapeDoubleQuotes, escapeSingleQuotes } = require('@sap/hdbext').sqlInjectionUtils;
const moment = require('moment');
const sanitizeString = (value) => {
    if (!value) return "";
    let output = value.replace(/\s\s+/g, ' ');
    output = escapeSingleQuotes(output);
    return escapeDoubleQuotes(output);

};

const formatDate = (date, dateFormat, dateToFormat) => {
    if (date) {
        return moment(date, dateFormat).format(dateToFormat);
    }
    return "";
};

const findStateNameFromCode = (stateCode) => {
    switch (stateCode) {
        case "1":
        case "01":
        case 1:
            return "Jammu and Kashmir";

        case "2":
        case "02":
        case 2:
            return "Himachal Pradesh";

        case "3":
        case "03":
        case 3:
            return "Punjab";

        case "4":
        case "04":
        case 4:
            return "Chandigarh";

        case "5":
        case "05":
        case 5:
            return "Uttarakhand";

        case "6":
        case "06":
        case 6:
            return "Haryana";

        case "7":
        case "07":
        case 7:
            return "Delhi";

        case "8":
        case "08":
        case 8:
            return "Rajasthan";

        case "9":
        case "09":
        case 9:
            return "Uttar Pradesh";

        case "10":
        case 10:
            return "Bihar";

        case "11":
        case 11:
            return "Sikkim";

        case "12":
        case 12:
            return "Arunachal Pradesh";

        case "13":
        case 13:
            return "Nagaland";

        case "14":
        case 14:
            return "Manipur";

        case "15":
        case 15:
            return "Mizoram";

        case "16":
        case 16:
            return "Tripura";

        case "17":
        case 17:
            return "Meghalaya";

        case "18":
        case 18:
            return "Assam";

        case "19":
        case 19:
            return "West Bengal";

        case "20":
        case 20:
            return "Jharkhand";

        case "21":
        case 21:
            return "Odisha";

        case "22":
        case 22:
            return "Chhattisgarh";

        case "23":
        case 23:
            return "Madhya Pradesh";

        case "24":
        case 24:
            return "Gujarat";

        case "25":
        case 25:
            return "Daman and Diu";

        case "26":
        case 26:
            return "Dadra and Nagar Haveli and Daman and Diu";

        case "27":
        case 27:
            return "Maharashtra";

        case "29":
        case 29:
            return "Karnataka";

        case "30":
        case 30:
            return "Goa";

        case "31":
        case 31:
            return "Lakshadweep";

        case "32":
        case 32:
            return "Kerala";

        case "33":
        case 33:
            return "Tamil Nadu";

        case "34":
        case 34:
            return "Puducherry";

        case "35":
        case 35:
            return "Andaman and Nicobar Islands";

        case "36":
        case 36:
            return "Telangana";

        case "37":
        case 37:
            return "Andhra Pradesh";

        case "97":
        case 97:
            return "Other Territory";

        case "98":
        case 98:
            return "Other Territory";

        case "99":
        case 99:
            return "Other Territory";

        default:
            return "";
    }
}

module.exports = {
    sanitizeString,
    formatDate,
    findStateNameFromCode
};