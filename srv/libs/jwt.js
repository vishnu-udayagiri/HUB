const jwt = require('jsonwebtoken');

/**
 * TODO: fetch secret from env variable rather than hardcodeing
 */
const secret = process.env.JWT_SECRET;
// const secret = process.env.secret;

const generateJWT = (data) => {
    return jwt.sign(data, secret, { expiresIn: '124h' });
};

const verifyJWT = (token) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error(error.message);
    }

};

module.exports = {
    generateJWT,
    verifyJWT
};