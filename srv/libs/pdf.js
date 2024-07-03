const pdf = require('pdf-parse');
const pdfjsLib = require('pdfjs-dist');
const { join } = require('path');
const pdfToText = (base64Text) => {
    return new Promise((resolve, reject) => {
        try {
            const dataBuffer = new Buffer.from(base64Text, 'base64');
            const options = {};
            options.pagerender = render_page
            pdf(dataBuffer.buffer, options).then(function (data) {
                let source = data.text;
                source = source.replace(/(\r\n|\n|\r)/gm, "|");  //replacing newline chars with pipe char (|)
                source = source.replace(/\s+/g, ' ').trim();
                source += "#END";
                resolve(source.trim());
            });
        } catch (error) {
            reject(error);
        }
    });
};
const newPDFToText = async (base64Text) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Load the PDF
            // turn base64 string to bytes array with nodejs
            const pdfBytes = new Uint8Array(Buffer.from(base64Text, 'base64'));
            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes, standardFontDataUrl: join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/') });
            const pdf = await loadingTask.promise;

            // Get the total number of pages in the PDF
            const numPages = pdf.numPages;

            // Loop through each page to extract text
            for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                const textItems = textContent.items;

                let extractedText = '';
                for (let i = 0; i < textItems.length; i++) {
                    extractedText += textItems[i].str + ' ';
                }
                extractedText = extractedText.replace(/(\r\n|\n|\r)/gm, " ");  //replacing newline chars with pipe char (|)
                extractedText = extractedText.replace(/\s+/g, ' ').trim();

                // Use the replace() method with the regex to remove invalid characters
                const invalidCharacterRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
                extractedText = extractedText.replace(invalidCharacterRegex, '');
                resolve(extractedText);
            }
        } catch (error) {
            reject(error);
        }
    });
};

function render_page(pageData) {
    //check documents https://mozilla.github.io/pdf.js/
    //ret.text = ret.text ? ret.text : "";

    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
        .then(function (textContent) {
            let lastY, text = '';
            //https://github.com/mozilla/pdf.js/issues/8963
            //https://github.com/mozilla/pdf.js/issues/2140
            //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
            //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY) {
                    text += item.str;
                    if (item.str != " ") text += " "
                }
                else {
                    text += '\n' + item.str;
                    if (item.str != " ") text += " "
                }
                lastY = item.transform[5];
            }
            //let strings = textContent.items.map(item => item.str);
            //let text = strings.join("\n");
            //text = text.replace(/[ ]+/ig," ");
            //ret.text = `${ret.text} ${text} \n\n`;
            return text;
        });
}

module.exports = {
    newPDFToText,
    pdfToText
};