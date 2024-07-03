sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",

], function(
    Controller, MessageToast
) {
    "use strict";

    return Controller.extend("com.ivl.optihub.ui5.controller.Login", {
        onInit: function() {
            this.getOwnerComponent().ValidateUser("login");
            this.oRouter = this.getOwnerComponent().getRouter();
            this.SendRequest = this.getOwnerComponent().SendRequest;
            this.getOwnerComponent().getModel("shellModel").setProperty("/show", false);

        },
        onLogin: function() {
            sap.ui.core.BusyIndicator.show();
            const email = this.byId("email").getValue().trim();
            const password = this.byId("password").getValue().trim();

            if (!email || !password) {
                MessageToast.show("Please enter email and password");
                return;
            }

            const cred = btoa(email + ":" + password);
            this.SendRequest(this, "/hub/api/v1/user/login", "POST", { Authorization: "Basic " + cred }, undefined, this.cbLoggedin);
        },
        cbLoggedin: function(_self, data, message) {
            _self.getOwnerComponent().getModel("shellModel").setProperty("/show", true);
            sessionStorage.setItem("shellData", JSON.stringify({ show: true }));
            _self.oRouter.navTo("dashboard");
            sessionStorage.setItem("auth", data.token);
            sap.ui.core.BusyIndicator.hide();
        },
    });
});