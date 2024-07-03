sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function(
    Controller, MessageBox
) {
    "use strict";

    return Controller.extend("com.ivl.optihub.ui5.controller.Dashboard", {
        onInit: function() {
            // this.getOwnerComponent().ValidateUser();
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("dashboard").attachPatternMatched(this._routeMatched, this)
            this.SendRequest = this.getOwnerComponent().SendRequest;

        },
        _routeMatched: function(oEvent) {
            this.getOwnerComponent().getModel("shellModel").setProperty("/show", true);
        },
        openExtractPDF: function(oEvent) {
            this.oRouter.navTo("ExtractPDF");
        },
        openValidatorForGST: function(oEvent) {
            this.oRouter.navTo("GSTValidation");
        },

        openURLShortner: function(oEvent) {
            this.oRouter.navTo("URLShortner");
        },

    });
});