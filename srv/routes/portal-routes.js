const router = require('express').Router();

const { getClientIdAndSecret, reGenerateCredential, createShortUrl, getUrlData, updateUrlState, deleteShortenedUrl } = require('../controller/portal-controller.js');

router.get("/get-client-details", getClientIdAndSecret);
router.post("/regenerate-credential", reGenerateCredential);
router.post("/create-short-url", createShortUrl);
router.get("/get-url-data", getUrlData);
router.post("/change-url-state", updateUrlState);
router.delete("/delete-shortened-url", deleteShortenedUrl);

module.exports = router;