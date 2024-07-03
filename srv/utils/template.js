const { formatDate } = require('./sanitization');
/**
 * Extracts possible values from a source based on the given start label,end label and pattern
 * @param {String} startLabel Start label to start looking for possible value
 * @param {String} endLabel End label to stop looking for possible value
 * @param {String} pattern Regex pattern
 * @param {String} source Actual source to look for values.
 * @returns 
 */
function extractPossibleValues(startLabel, endLabel, pattern, replace, source, index, isDate, dateFormat, dateToFormat) {
    const sourceSplit = source.split(startLabel);
    const finalMatches = [];
    sourceSplit.forEach(part => {

        if (part.indexOf(endLabel) != -1) {
            const possibleTexts = part.split(endLabel)[0].trim();
            let regEx = new RegExp(pattern, 'g');
            const arrField = possibleTexts.match(regEx);
            if (arrField) {
                arrField.forEach(field => {
                    if (field) {
                        let value = field;
                        if (replace.length) {
                            replace.forEach(replacer => {
                                value = value.replaceAll(replacer, '');
                            });
                        }
                        if (isDate) {
                            value = formatDate(value, dateFormat, dateToFormat);
                        }
                        finalMatches.push({
                            index: finalMatches.length,
                            value: value.trim()
                        });
                    }
                });
            }
        }
    });
    if (!(index == undefined || index == null)) {
        if (finalMatches.length && finalMatches.length > index) {
            return finalMatches[index].value.trim();
        }
    }
    return finalMatches;
}

module.exports = {
    extractPossibleValues
};