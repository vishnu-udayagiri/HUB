const router = require('express').Router();

const { userLogin } = require('../controller/user-controller');

router.post("/login", userLogin);



module.exports = router;