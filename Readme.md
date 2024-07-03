Response from backend must be in the format
    {
        "Status": "Success/Failed",
        "Message": {
                "Text": "MessageText",
                "Type": "T/B", /*Show as Toast or Box*/
                "Code": "S", /* Success(S),Error(E)... */
                "ShowMessage": true, /* Show Message at component.js level or not*/ 
            } or null,
        "Data": "{obj}" or null /*If Data is not null always encode as base64*/ 
    }    