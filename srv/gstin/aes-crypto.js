const crypto = require('crypto');

function encrypt(pass, str) {
    
    var key = Buffer.from(pass, 'base64');
    console.log("*** Enc ******** %d ****", key.length);
    var cipher = crypto.createCipheriv('aes-256-ecb', key, Buffer.from(''));
    var crypted = cipher.update(str, 'utf8','base64');
    crypted += cipher.final('base64');
 
    return crypted;

   
}


function decrypt(pass, str) {
    var key = Buffer.from(pass, "base64");
    // console.log("*** Dec ******** %d ****", key.length);

    var decipher = crypto.createDecipheriv('aes-256-ecb', key, Buffer.from(''));
    var decrypted = decipher.update(str, 'base64', 'base64');
    decrypted += decipher.final('base64');

    return decrypted;
}


module.exports = {
    Encrypt: encrypt,
    Decrypt: decrypt
};
