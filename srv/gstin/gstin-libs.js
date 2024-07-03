const fs = require("fs");
const path = require('path');
const crypto = require("crypto");
const NodeRSA = require('node-rsa');
const axios = require("axios");
const aescrypto = require("./aes-crypto");
const {
    StageUrl,
    ClientId,
    ClientSecret,
    UserName,
    Password,
    GSTIN
} = require("./keystore/gsp.json");

const PublicKey = fs.readFileSync(path.join(__dirname, "./keystore/Exact_PublicKey/Exact_PublicKey.pem")).toString();
const IrpPublicKey = fs.readFileSync(path.join(__dirname, "./keystore/PublicKey/certificate_publickey.pem")).toString();
const rsaOptions = {
    "environment": "node",
    "encryptionScheme": "pkcs1",
    "signingScheme": "pkcs1"
};
const { findStateNameFromCode } = require("../utils/sanitization");
let _AppKey = "";
module.exports = {
    /**
     * @method ExactAuthenticate
     * @param {string} StageUrl 
     * @param {string} ClientId 
     * @param {string} ClientSecret 
     * @param {string} PublicKey 
     * @returns {object} esession 
     */

    ExactAuthenicate: async function () {
        console.log("ExactAuthenicate call");
        _AppKey = (crypto.randomBytes(32)).toString("base64");
        var rsa = new NodeRSA(PublicKey, 'pkcs8-public-pem', rsaOptions);
        var options = {
            url: StageUrl + '/api/authentication/Authenticate',//',
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                ClientId: ClientId,
                ClientSecret: rsa.encrypt(ClientSecret, "base64")
            })
        };
        var response = await axios(options);

        if (response.IsAuthenticated === false) {
            throw ("Authentication Failed");
        }
        return response;
    },

    AuthenticateIRP: async function (SubscriptionId, AuthenticationToken) {
        console.log("AuthenticateIRP call");
        var rsairp = new NodeRSA(IrpPublicKey, 'pkcs8-public-pem', rsaOptions);
        var payload = {
            "UserName": UserName,
            "Password": Password,
            "AppKey": _AppKey,
            "ForceRefreshAccessToken": false
        };
        console.log("Auth Version change v1.04" + "_046");
        var payloadBuff = Buffer.from(JSON.stringify(payload)).toString('base64');
        var options = {
            url: StageUrl + '/eivital/v1.04/auth',  //Changed by MG
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ExactSubscriptionId: SubscriptionId,
                AuthenticationToken: AuthenticationToken,
                Gstin: GSTIN
            },
            data: {
                Data: rsairp.encrypt(payloadBuff, "base64")
            }
        };


        var response = await axios(options);
        if (response.data.Status !== 1 || response.data.ErrorDetails !== null) {
            throw ("Login with IRP Failed");
        }

        response.data.Data.sekB64 = aescrypto.Decrypt(_AppKey, response.data.Data.Sek);
        return response.data;
    },

    GetGSTINData: async function (SubscriptionId, AuthenticationToken, Username, AuthToken, SekB64, gstinNumber) {

        var options = {
            url: StageUrl + '/eivital/v1.04/Master?gstin=' + gstinNumber,
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Gstin": GSTIN,
                "user_name": Username,
                "AuthToken": AuthToken,
                "ExactSubscriptionId": SubscriptionId,
                "AuthenticationToken": AuthenticationToken
            }
        };
        // console.log("GET GSTIN details ::", options);
        var response = await axios(options);
        if (response.data.Status == 0 && response.data.ErrorDetails != null) {
            return {
                Message: response.data.ErrorDetails.map((err) => err.ErrorMessage).join(","),
                Status: 0
            };
        }
        try {

            var decrypted = aescrypto.Decrypt(SekB64, response.data.Data);
            var checkDone = JSON.parse(Buffer.from(decrypted, "base64").toString());
            /**
             * "Status" will have values as 'ACT' (Active) or 'CNL' (Cancelled) or 'INA' (Inactive) or 'PRO' (Provision). Considered active only if status='ACT'
             * The "blkStatus" indicates the status of blocking of generation of E Way Bill and will have following values
             *      i) 'U' or '' for Unblocked
             *      ii) 'B' for blocked - E Way Bill generation is not allowed for tax payers who have not filed the returns for last two months
             */
            switch (checkDone.Status) {
                case 0:
                case "0":
                    checkDone.StatusInfoText = "";
                    break;
                case "ACT":
                    checkDone.StatusInfoText = "Active";
                    break;
                case "INA":
                    checkDone.StatusInfoText = "Inactive";
                    break;
                case "CNL":
                    checkDone.StatusInfoText = "Cancelled";
                    break;
                case "PRO":
                    checkDone.StatusInfoText = "Provision";
                    break;
                default:
                    checkDone.StatusInfoText = checkDone.Status;

            }
            switch (checkDone.BlkStatus) {
                case "U":
                    checkDone.BlkStatusInfoText = "Unblocked";
                    break;
                case "B":
                    checkDone.BlkStatusInfoText = "Blocked";
                    break;
                default:
                    checkDone.BlkStatusInfoText = checkDone.BlkStatus;
            }

            switch (checkDone.TxpType) {
                case "REG":
                    checkDone.TxpTypeInfoText = "Regular";
                    break;
                case "COM":
                    checkDone.TxpTypeInfoText = "Composition";
                    break;
                case "CTP":
                    checkDone.TxpTypeInfoText = "Casual Taxable Person";
                    break;
                case "SEZ":
                    checkDone.TxpTypeInfoText = "SEZ Unit";
                    break;
                case "UNB":
                    checkDone.TxpTypeInfoText = "United Nation Body";
                    break;
                case "ISD":
                    checkDone.TxpTypeInfoText = "Input Service Distributor (ISD)";
                    break;
                case "TDS":
                    checkDone.TxpTypeInfoText = "Tax Deductor";
                    break;
                default:
                    checkDone.TxpTypeInfoText = checkDone.TxpType;
                    break;
            }
            checkDone.State = findStateNameFromCode(checkDone.StateCode);
            return checkDone;

        } catch (e) {
            throw (e);
        }

    },

};