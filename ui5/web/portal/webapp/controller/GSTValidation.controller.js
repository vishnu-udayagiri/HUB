sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"

], function(
    Controller, MessageToast, JSONModel, MessageBox
) {
    "use strict";

    return Controller.extend("com.ivl.optihub.ui5.controller.GSTValidation", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;
            this.gstinValidationModel = new JSONModel();

        },
        onPressValidate: function() {
            const inputField = this.byId("IDInputValue");
            inputField.setValueState("None");
            const value = inputField.getValue();
            if (value) {
                if (this._validate(value)) {
                    sap.ui.core.BusyIndicator.show();
                    inputField.setValueState("Success").setValueStateText("");
                    this.SendRequest(this, "/hub/api/v1/portal/get-client-details", "GET", {}, null, (_self, data, message) => {
                        const auth = btoa(`${data.clientId}:${data.clientSecret}`);
                        this.SendRequest(_self, "/hub/api/validate-gstin?portal=true", "POST", {
                            Authorization: "Basic " + auth
                        }, JSON.stringify({"gstin": value}), (_self1, data, message) => {
                            if (data.Status == 0) {
                                MessageBox.error(data.Message);
                                _self1.byId("_IDGenBlockLayoutRow3").setVisible(false);
                            } else {
                                _self1.gstinValidationModel.setData(data);
                                _self1.getView().setModel(_self1.gstinValidationModel, "gstinValidationModel");
                                _self1.byId("_IDGenBlockLayoutRow3").setVisible(true);
                            }
                            sap.ui.core.BusyIndicator.hide();
                        });
                    });
                } else {
                    inputField.setValueState("Error").setValueStateText("Invalid GSTIN format");
                }
            } else {
                inputField.setValueState("Error").setValueStateText("Enter GSTIN to validate");
            }
        },
        _validate: function(value) {
            // const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
            // var Validate = value.match(regex);
            // if (Validate) {
            //     return true;
            // } else {
            //     return false;
            // }            
            return true;
        },
        setValidationStatusState: function(value) {
            switch (value) {
                case "ACT":
                    return "Success";
                default:
                    return "Error";
            }
        },
        setValidationStatusIcon: function(value) {
            switch (value) {
                case "ACT":
                    return "sap-icon://sys-enter-2";
                default:
                    return "sap-icon://error";
            }
        },
        setBlockedStatusState: function(value) {
            switch (value) {
                case "U":
                    return "Success";
                case "B":
                    return "Error";
            }
        },
        setBlockedStatusIcon: function(value) {
            switch (value) {
                case "U":
                    return "sap-icon://status-positive";
                case "B":
                    return "sap-icon://status-negative";
            }
        }

    });
});