var pdf2img = require('pdf-img-convert');
var { createWorker } = require('tesseract.js');
var fs = require('fs');
const extractOCR = async (req, res) => {
    try {
        let outputImages = pdf2img.convert(Buffer.from(req.body.base64File, 'base64'));
        let output = "";
        outputImages.then(async function (outputImages) {
            for (i = 0; i < outputImages.length; i++) {
                fs.writeFile("output"+i+".png", outputImages[i], function (error) {
                    if (error) { console.error("Error: " + error); }
                  });
                const worker = await createWorker({
                    logger: m => console.log(m)
                });
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(outputImages[i]);
                output += " " + text;
                output = output.trim();
                await worker.terminate();
            }
            debugger
        });

    } catch (error) {
        res.status(500).send(error);
    }
};


module.exports = {
    extractOCR
};