
const keygen = require("keygenerator");

const generateString = ({
    chars = true,
    sticks = false,
    numbers = true,
    specials = false,
    length = 7,
    forceUppercase = false,
    forceLowercase = false,
} = {}) => {
    return keygen._({
        chars,
        sticks,
        numbers,
        specials,
        length,
        forceUppercase,
        forceLowercase,
    });
}

module.exports = {
    generateString
}