const { v4: uuidv4 } = require('uuid');
const { encode } = require('js-base64');
const keygen = require("keygenerator");
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const { generateResponse } = require("../libs/response");
const { generateJWT } = require("../libs/jwt");
const { sanitizeString } = require('../utils/sanitization');

/**
 * Service to create a client with its first user
 */
const signUp = async (req, res) => {
    try {
        const {
            clientName,
            countryKey,
            language,
            email,
            userName,
            password
        } = req.body;

        const db = req.db;
        const clientId = uuidv4();

        const key = keygen._({
            chars: true,
            sticks: false,
            numbers: true,
            specials: false,
            length: 22,
            forceUppercase: false,
            forceLowercase: false,
        });

        //TODO: Role from options now A (ADMIN) is hardcoded
        //TODO: check if email arleady exists
        const hashPassword = await bcrypt.hash(password, 12);
        await db.exec(`INSERT INTO "HubClients" ("clientId","clientName","countryKey","language","clientSecret")
                                    VALUES ('${clientId}', '${clientName}', '${countryKey}', '${language}',
                                    '${encode(encode(key))}')`);
        await db.exec(`INSERT INTO "HubUsers" ("userId","clientId","userName","password","userRole")
                                    VALUES ('${email}','${clientId}','${userName}','${hashPassword}','A')`);
        res.status(201).send("User Created");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const userLogin = async (req, res) => {
    try {
        const db = req.db;
        let auth = req.headers.authorization.split(" ")[1];
        if (!(auth.length > 0)) return res.status(401).send(generateResponse("Failed", "Missing authorization object", "B", "E", null, true, null));
        auth = Buffer.from(auth, 'base64').toString("ascii");
        const [email, password] = auth.split(":");
        if (!email) return res.status(401).send(generateResponse("Failed", "Email must be provided", "B", "E", null, true, null));
        if (!isEmail(email)) return res.status(504).send(generateResponse("Failed", "Invalid Email Id", "B", "E", null, true, null));
        if (!password) return res.status(401).send(generateResponse("Failed", "Password must be provided", "B", "E", null, true, null));

        const user = db.exec(`SELECT * FROM "HubUsers" WHERE LOWER("userId") = LOWER('${email}')`);
        if (!(user.length > 0)) return res.status(401).send(generateResponse("Failed", "User does not exists", "B", "E", null, true, null));
        const profile = user[0];
        const passMatched = await bcrypt.compare(password, profile.password);
        if (!passMatched) return res.status(401).send(generateResponse("Failed", "Incorrect password", "B", "E", null, true, null));
        var jwtPayload = {};
        jwtPayload.cid = profile.clientId;
        jwtPayload.email = profile.userId;
        jwtPayload.name = profile.userName;
        jwtPayload.role = profile.userRole;
        const jwt = generateJWT(jwtPayload);
        const { ['password']: remove, ...rest } = profile;
        return res.status(200).send(generateResponse("Success", "Logged in succesfully", "T", "S", "null", false, { token: jwt, profile: rest }));
    } catch (error) {
        return res.status(500).send(generateResponse("Failed", error.message, "B", "E", null, true, null));
    }
};

module.exports = {
    signUp,
    userLogin
};