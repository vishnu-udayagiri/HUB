sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function(
    Controller,
    JSONModel,
    MessageBox,
    MessageToast
) {
    "use strict";

    return Controller.extend("ivl.optihub.admindashboard.controller.SubscriptionPlans", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;
            //i18n Resource Bundle 
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            //JSON Models
            this.newSubPlansModel = new JSONModel({});
            this.getView().setModel(this.newSubPlansModel, "newSubPlansModel");
            this.subscriptionPlanListModel = new JSONModel();
            this.getView().setModel(this.subscriptionPlanListModel, "subscriptionPlanListModel");

            // toggling
            this.configModel = new JSONModel();
            this.getView().setModel(this.configModel);

            this.getView().getModel().setProperty("/toggleEdit", false);
            this.subscriptionPlanListModel = new JSONModel();
            this.getView().setModel(this.subscriptionPlanListModel, "subscriptionPlanListModel");
            this.countryMasterModel = new sap.ui.model.json.JSONModel();
            this.currencyMasterModel = new sap.ui.model.json.JSONModel();
            this.languageMasterModel = new sap.ui.model.json.JSONModel();

            this.oRouter.getRoute("SubscriptionPlans").attachPatternMatched(this._handleRouteMatched, this);
        },
        /*
         * get ID of Selected from route
         */
        _handleRouteMatched: function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            this.newSubPlansModel.setData({});
            this.subscriptionPlanListModel.setData({});
            this._refreshInputValidation();
            this._fetchMasterData();
            this.SendRequest(this, "/admin-srv/api/v1/admin/get-subscription-plan", "get", {}, null, (_self, data, message) => {
                _self.subscriptionPlanListModel.setData(data);
                sap.ui.core.BusyIndicator.hide();
            });
        },
        _fetchMasterData: function() {
            const countryMasterData = sessionStorage.getItem("countryMasterData");
            const currencyMasterData = sessionStorage.getItem("currencyMasterData");
            const languageMasterData = sessionStorage.getItem("languageMasterData");
            //Country
            if (!countryMasterData) {
                this.SendRequest(this, "/admin-srv/api/v1/resource/country", "GET", {}, null, (_self, countryData, message) => {
                    sessionStorage.setItem("countryMasterData", JSON.stringify(countryData));
                    _self.countryMasterModel.setData(countryData);
                    _self.countryMasterModel.setSizeLimit(countryData.length);
                    _self.getView().setModel(this.countryMasterModel, "countryMasterModel");
                });
            } else {
                this.countryMasterModel.setData(JSON.parse(countryMasterData));
                this.countryMasterModel.setSizeLimit(JSON.parse(countryMasterData).length);
                this.getView().setModel(this.countryMasterModel, "countryMasterModel");
            }
            //Currency
            if (!currencyMasterData) {
                this.SendRequest(this, "/hub/api/v1/resource/currency", "GET", {}, null, (_self, currencyData, message) => {
                    sessionStorage.setItem("currencyMasterData", JSON.stringify(currencyData));
                    _self.currencyMasterModel.setData(currencyData);
                    _self.currencyMasterModel.setSizeLimit(currencyData.length);
                    _self.getView().setModel(this.currencyMasterModel, "currencyMasterModel");

                });
            } else {
                this.currencyMasterModel.setData(JSON.parse(currencyMasterData));
                this.currencyMasterModel.setSizeLimit(JSON.parse(currencyMasterData).length);
                this.getView().setModel(this.currencyMasterModel, "currencyMasterModel");

            }
            //Language
            if (!languageMasterData) {
                this.SendRequest(this, "/hub/api/v1/resource/language", "GET", {}, null, (_self, languageData, message) => {
                    sessionStorage.setItem("languageMasterData", JSON.stringify(languageData));
                    _self.languageMasterModel.setData(languageData);
                    _self.languageMasterModel.setSizeLimit(languageData.length);
                    _self.getView().setModel(this.languageMasterModel, "languageMasterModel");
                });
            } else {
                this.languageMasterModel.setData(JSON.parse(languageMasterData));
                this.languageMasterModel.setSizeLimit(JSON.parse(languageMasterData).length);
                this.getView().setModel(this.languageMasterModel, "languageMasterModel");
            }
        },
        onCreateSubPlan: function(oEvent) {
            const newSubPlanData = this.newSubPlansModel.getData();
            if (this._handleInputValidation()) {
                sap.ui.core.BusyIndicator.show();
                newSubPlanData.isTrial = this.byId("ID_IsTrial").getSelected();
                newSubPlanData.isActive = this.byId("ID_IsActive").getSelected();
                this.SendRequest(this, "/admin-srv/api/v1/admin/create-subscription-plan", "post", {}, newSubPlanData, (_self, data, message) => {
                    _self.getView().getModel("subscriptionPlanListModel").setData(data);
                    _self.newSubPlansModel.setData({});
                    _self.byId("ID_CreateSection").setTitle(_self.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
                    _self.byId("ID_TitleSubPlans").setText(_self.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
                    _self.getView().getModel().setProperty("/toggleEdit", false);
                    sap.ui.core.BusyIndicator.hide();
                });
            }
        },
        _handleInputValidation: function() {
            var validate = true;
            const subscriptionPlanDesc_ID = this.byId("ID_SubscriptionPlanDesc");
            const countryKey_ID = this.byId("ID_CountryKey");
            const currency_ID = this.byId("ID_Currency");
            if (subscriptionPlanDesc_ID.getValue()) {
                subscriptionPlanDesc_ID.setValueState("None").setValueStateText("");
            } else {
                subscriptionPlanDesc_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgSubPlanDescMandatory"));
                validate = false;
            }

            if (countryKey_ID.getSelectedKey()) {
                countryKey_ID.setValueState("None").setValueStateText("");
            } else {
                countryKey_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgCountryMandatory"));
                validate = false;
            }

            if (currency_ID.getSelectedKey()) {
                currency_ID.setValueState("None").setValueStateText("");
            } else {
                currency_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgCurrencyMandatory"));
                validate = false;
            }
            return validate;
        },
        onSubscriptionPlanDeletePress: function(oEvent) {
            const oIndex = oEvent.getSource().getParent().getParent().getIndex(),
                oTable = this.byId("ID_SubscriptionPlanList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgDeleteComfirmation"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: "OK",
                onClose: function(sAction) {
                    if (sAction == "OK") {
                        sap.ui.core.BusyIndicator.show();
                        _self.SendRequest(_self, `/admin-srv/api/v1/admin/delete-subscription-plan`, "delete", {}, { "subscriptionPlanId": oObject.subscriptionPlanId }, (_self1, data, message) => {
                            _self1.getView().getModel("subscriptionPlanListModel").setData(data);
                            _self1.onRefreshScreen();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                }
            });
        },
        onSubscriptionPlanEditPress: function(oEvent) {
            const oIndex = oEvent.getParameter("row").getIndex(),
                oTable = this.byId("ID_SubscriptionPlanList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            this.newSubPlansModel.setData({...oObject });
            this._refreshInputValidation();

            // Toggle Visibility for edit
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlUpdateSubscriptionPlan"));
            this.byId("ID_TitleSubPlans").setText(this.oResourceBundle.getText("ttlUpdateSubscriptionPlan"));
            this.getView().getModel().setProperty("/toggleEdit", true);
        },
        onCancelEditSubPlan: function(oEvent) {
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgEditCancelComfirmation"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: "OK",
                onClose: function(sAction) {
                    if (sAction == "OK") {
                        _self.onRefreshScreen();
                    }
                }
            });
        },
        onRefreshScreen: function() {
            this.newSubPlansModel.setData({});
            this._refreshInputValidation();
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
            this.byId("ID_TitleSubPlans").setText(this.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
            this.getView().getModel().setProperty("/toggleEdit", false);
        },
        _refreshInputValidation: function() {
            const subscriptionPlanDesc_ID = this.byId("ID_SubscriptionPlanDesc");
            const countryKey_ID = this.byId("ID_CountryKey");
            const currency_ID = this.byId("ID_Currency");
            subscriptionPlanDesc_ID.setValueState("None").setValueStateText("");
            countryKey_ID.setValueState("None").setValueStateText("");
            currency_ID.setValueState("None").setValueStateText("");
        },
        /** Code--> Description */
        setCountryName: function(oValue) {
            if (oValue) {
                const country = this.countryMasterModel.getData();
                const description = country.find(x => x.countryKey === oValue);
                return description.countryName;
            }
        },
        setCurrencyName: function(oValue) {
            if (oValue) {
                const currency = this.currencyMasterModel.getData();
                const description = currency.find(x => x.currencyCode === oValue);
                return description.currencyLongText;
            }
        }
    });
});