var express = require('express');
var { middleware } = require("@sap/hdbext");
const passport = require('passport');
const xssec = require('@sap/xssec');
const xsenv = require('@sap/xsenv');
var app = express();
// require('dotenv').config();
// xsenv.loadEnv(); // load environment variables from .env file
const services = xsenv.getServices({ // get services from xsuaa tag
    uaa: { tag: 'xsuaa' },
    hana: { tag: 'hana' }
});

const adminRoutes = require("./routes/admin-routes");
const userRoutes = require("./routes/user-routes");
const extractorRoutes = require("./routes/file-extraction-routes");
const trainingRoutes = require("./routes/training-routes");
const apiRoutes = require("./routes/api-routes");
const utilityServiceRoutes = require("./routes/utility-service-routes");
const resourceRoutes = require("./routes/resource-routes.js");
const portalRoutes = require("./routes/portal-routes");
const { urlRedirect } = require("./controller/portal-controller.js");
const { validateUser, validateClientSecret } = require("./middleware/validate-user");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

passport.use('JWT', new xssec.JWTStrategy(services.uaa)); // create passport strategy
app.use(passport.initialize()); // initialize passport middleware
app.use(middleware(services.hana));
/**
 * First middleware
 * To altering the default behavior of res.send
 */
app.use(function (req, res, next) {
    res.response = function (obj) {
        req.res = obj;
    };
    next();
});

/**
 * TODO: Middle ware to check quota access and all
 */
app.use(function (req, res, next) {
    // res.status(500).send("Error");
    next();
});

/**
 * Actual Routes
 */
app.use("/us/:key", urlRedirect);
app.use("/api/v1/resource", resourceRoutes)
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/extractor", validateUser, extractorRoutes);
app.use("/api/v1/trainer", validateUser, trainingRoutes);
app.use("/api/v1/portal", validateUser, portalRoutes);
//TODO: Configure Passport service;
app.use("/api/v1/admin", passport.authenticate('JWT', {
    session: false
}), (req, res, next) => {
    if (req.authInfo.checkScope("$XSAPPNAME.OptihubAdmin")) next();
    else return res.status(401).send("Unauthorized");
}, adminRoutes);
app.use("/api/v1/utility", validateClientSecret, utilityServiceRoutes);
app.use("/api", validateClientSecret, apiRoutes);

/**
 * MiddleWare to handle processing the request
 * Encryption tracking of request can be done here
 */
app.use(function (req, res) {
    res.send(req.res);
});

const port = process.env.PORT || 4004;

app.listen(port, function () {
    console.log(`listening on port ${port}`);
});