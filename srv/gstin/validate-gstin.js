const { ExactAuthenicate, AuthenticateIRP, GetGSTINData } = require("./gstin-libs");

let AuthToken1 = "";
let SubscriptionId = "";
let TokenExpiry = "";
let AuthToken2 = "";
let Username = "";
let SekB64 = "";


const doAuthentication = async () => {
    const auth1 = await ExactAuthenicate();
    SubscriptionId = auth1.data.AuthorizedSubscriptions[0].SubscriptionId;
    AuthToken1 = auth1.data.AuthenticationToken;
    const auth2 = await AuthenticateIRP(SubscriptionId, AuthToken1);

    /**
     * Remove Start
    
    SubscriptionId = 'e29b3d4f-6632-4725-a104-203e745ab757';
    AuthToken1 = '25A86AE5893CB51A67AD27E8D4835347A6B7D666AC6C2130557477A0B5CC6097F8BD0A2805B6FB3F06349B42990FCC83C558A6E3E44ADB890131ABF0A217AED6E73C0B695D3A676EF987C2D6C00BC860CB0503DD2F5ACFF3D419909F778EEE2D7B4FE05B97D0FDC84E5516E6D6223D67A4250B4014686480A017C88DE46A50831527EBF7345A2B358D3D4D83FF190496A718C5945F6FD35DE8F6E0B92C49729595D6D75801F92AE08485D91D24145ED96B36C891232784F16EFD86FE8CCBE537303F7E2A348646ACC4779B17737E2359C16E8B078223B44DDF58345DE2BDB966';
    const auth2 = {
        Status: 1,
        ErrorDetails: null,
        Data: {
            ClientId: 'AAYPT29GSPVK3I9',
            UserName: 'Excellon',
            AuthToken: 'wYga9lsJw6XeyTWWXrPPPpU0R',
            Sek: 'YCi50T3h1cvzGttWprQ2hoXSBBTeRjF1kOrBqJBkuL2gpwsbdQUOf1G93um711Sz',
            TokenExpiry: '2023-04-03 23:04:13',
            sekB64: 'Cl4sUaidtDjZMb/tN1I9slMMraXa4kz0xI9pNANzxG0='
        },
        InfoDtls: null
    };


    * Remove END
    */
    TokenExpiry = auth2.Data.TokenExpiry;
    AuthToken2 = auth2.Data.AuthToken;
    Username = auth2.Data.UserName;
    SekB64 = auth2.Data.sekB64;
};

const validateGSTIN = async (gstin) => {
    if (AuthToken2 == "" || ((new Date(TokenExpiry)).getTime() < (new Date()).getTime())) {
        await doAuthentication();
    }
    const gstinDetails = await GetGSTINData(SubscriptionId, AuthToken1, Username, AuthToken2, SekB64, gstin);
    return gstinDetails;
};

module.exports = {
    validateGSTIN
};