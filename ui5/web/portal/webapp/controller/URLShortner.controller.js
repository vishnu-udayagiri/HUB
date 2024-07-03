sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function(
    Controller, MessageToast, JSONModel, MessageBox
) {
    "use strict";

    return Controller.extend("com.ivl.optihub.ui5.controller.URLShortner", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //i18n Resource Bundle 
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;
            this.urlModel = new JSONModel();
            this.getView().setModel(this.urlModel, "urlModel");
            this.oRouter.getRoute("URLShortner").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function() {
            sap.ui.core.BusyIndicator.show();
            this.SendRequest(this, "/hub/api/v1/portal/get-url-data", "GET", {}, null, (_self, data, message) => {
                _self.urlModel.setData(data);
                sap.ui.core.BusyIndicator.hide();
            });
        },
        onCreateShortUrl: function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            var url = this.byId("ID_longURL").getValue();
            this.byId("ID_longURL").setValueState("None");
            if (this._validateURL(url)) {
                url = btoa(encodeURI(url));
                this.SendRequest(this, "/hub/api/v1/portal/create-short-url", "POST", {}, JSON.stringify({ longUrl: url }), (_self, data, message) => {
                    debugger;
                    _self.byId("ID_shortURL").setValue(data.shortUrl);
                    _self.byId("ID_copy").setEnabled(true);
                    this.byId("ID_longURL").setValue("");
                    _self.byId("ID_execute").setEnabled(true);
                    _self._onObjectMatched();
                });
            } else {
                this.byId("ID_longURL").setValueState("Error").setValueStateText("Invalid URL");
                sap.ui.core.BusyIndicator.hide();
            }
        },
        _validateURL: function(url) {
            var pattern = /^(https?:\/\/)?([\w.-]+)\.([a-zA-Z]{2,6})(\/[\w\.-]*)*\/?(\?[\w%.-]+=[\w.-]+(&[\w%.-]+=[\w.-]+)*)?(#[\w-]*)?$/;

            // Test the URL against the pattern
            return pattern.test(url);
        },
        onChangeState: function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            const state = oEvent.getParameters().state;
            const selObject = oEvent.getSource().getBindingContext("urlModel").getObject();
            this.SendRequest(this, "/hub/api/v1/portal/change-url-state", "POST", {}, JSON.stringify({ Id: selObject.Id, active: state }), (_self, data, message) => {
                _self._onObjectMatched();
            });
        },

        onDeleteField: function(oEvent) {
            var selObject = oEvent.getSource().getBindingContext("urlModel").getObject();
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgDeleteField"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function(sAction) {
                    sap.ui.core.BusyIndicator.show();
                    if (sAction == "OK") {
                        _self.SendRequest(_self, "/hub/api/v1/portal/delete-shortened-url", "DELETE", {}, JSON.stringify({ Id: selObject.Id }), (_self, data, message) => {
                            _self._onObjectMatched();
                        });
                    }
                },
            });
        },

        onCopyUrl: function(oEvent) {
            var shortURL = this.byId("ID_shortURL").getValue();
            navigator.clipboard.writeText(shortURL);
            MessageToast.show("Copied")
        },
        onCopyShortUrl: function(oEvent) {
            const selObject = oEvent.getSource().getBindingContext("urlModel").getObject();
            navigator.clipboard.writeText(selObject.shortUrl);
            MessageToast.show("Copied")
        }
    });
});