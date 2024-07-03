sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function(
    Controller,
    JSONModel,
    MessageBox
) {
    "use strict";

    return Controller.extend("ivl.optihub.admindashboard.controller.SubscriptionService", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send RequestnewSubServiceData
            this.SendRequest = this.getOwnerComponent().SendRequest;
            //i18n Resource Bundle 
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            //JSON Models
            this.newSubServiceModel = new JSONModel({});
            this.getView().setModel(this.newSubServiceModel, "newSubServiceModel");
            this.subscriptionServiceModel = new JSONModel();
            this.getView().setModel(this.subscriptionServiceModel, "subscriptionServiceModel");
            this.subscriptionServiceListModel = new JSONModel();
            this.getView().setModel(this.subscriptionServiceListModel, "subscriptionServiceListModel");

            // toggling
            this.configModel = new JSONModel();
            this.getView().setModel(this.configModel);

            this.getView().getModel().setProperty("/toggleEdit", false);
            this.countryMasterModel = new sap.ui.model.json.JSONModel();
            this.currencyMasterModel = new sap.ui.model.json.JSONModel();
            this.languageMasterModel = new sap.ui.model.json.JSONModel();

            this.oRouter.getRoute("SubscriptionService").attachPatternMatched(this._handleRouteMatched, this);
        },
        /*
         * get ID of Selected from route
         */
        _handleRouteMatched: function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            this.newSubServiceModel.setData({});
            this.subscriptionServiceModel.setData({});
            this._refreshInputValidation();
            this._fetchMasterData();
            this.SendRequest(this, "/admin-srv/api/v1/admin/get-subscription-service", "get", {}, null, (_self, data, message) => {
                _self.subscriptionServiceListModel.setData(data.subscriptionServiceList);
                sessionStorage.setItem("subscriptionService", JSON.stringify(data));
                _self.subscriptionServiceModel.setData(data);
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
        onCreateSubService: function(oEvent) {
            if (this._handleInputValidation()) {
                sap.ui.core.BusyIndicator.show();
                const newSubServiceData = this.newSubServiceModel.getData();
                newSubServiceData.isActive = this.byId("ID_IsActive").getSelected();
                this.SendRequest(this, "/admin-srv/api/v1/admin/create-subscription-service", "post", {}, newSubServiceData, (_self, data, message) => {
                    _self.getView().getModel("subscriptionServiceListModel").setData(data);
                    _self.newSubServiceModel.setData({});
                    _self.byId("ID_CreateSection").setTitle(_self.oResourceBundle.getText("ttlCreateSubscriptionService"));
                    _self.byId("ID_TitleSubService").setText(_self.oResourceBundle.getText("ttlCreateSubscriptionService"));
                    _self.getView().getModel().setProperty("/toggleEdit", false);
                    sap.ui.core.BusyIndicator.hide();
                });
            }
        },
        _handleInputValidation: function() {
            var validate = true;
            const subscriptionPlanId_ID = this.byId("ID_SubscriptionPlanId");
            const serviceId_ID = this.byId("ID_ServiceId");
            const currency_ID = this.byId("ID_Currency");
            const rateType_ID = this.byId("ID_RateType");
            const rateAmount_ID = this.byId("ID_RateAmount");

            if (subscriptionPlanId_ID.getValue()) {
                subscriptionPlanId_ID.setValueState("None").setValueStateText("");
            } else {
                subscriptionPlanId_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("subscriptionPlanIdMandatory"));
                validate = false;
            }

            if (serviceId_ID.getSelectedKey()) {
                serviceId_ID.setValueState("None").setValueStateText("");
            } else {
                serviceId_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("serviceId_ID"));
                validate = false;
            }

            if (currency_ID.getSelectedKey()) {
                currency_ID.setValueState("None").setValueStateText("");
            } else {
                currency_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgCurrencyMandatory"));
                validate = false;
            }

            if (rateType_ID.getSelectedKey()) {
                rateType_ID.setValueState("None").setValueStateText("");
            } else {
                rateType_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgRateTypMandatorye"));
                validate = false;
            }

            if (rateAmount_ID.getValue()) {
                rateAmount_ID.setValueState("None").setValueStateText("");
            } else {
                rateAmount_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgRateAmountMandatory"));
                validate = false;
            }
            return validate;
        },
        onSubscriptionServiceDeletePress: function(oEvent) {
            const oIndex = oEvent.getSource().getParent().getParent().getIndex(),
                oTable = this.byId("ID_SubscriptionServiceList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            const reqData = {
                "subscriptionPlanId": oObject.subscriptionPlanId,
                "serviceId": oObject.serviceId
            }
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgDeleteComfirmation"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: "OK",
                onClose: function(sAction) {
                    if (sAction == "OK") {
                        sap.ui.core.BusyIndicator.show();
                        _self.SendRequest(_self, `/admin-srv/api/v1/admin/delete-subscription-service`, "delete", {}, reqData, (_self1, data, message) => {
                            _self1.getView().getModel("subscriptionServiceListModel").setData(data);
                            _self1.onRefreshScreen();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                }
            });
        },
        onSubscriptionServiceEditPress: function(oEvent) {
            const oIndex = oEvent.getParameter("row").getIndex(),
                oTable = this.byId("ID_SubscriptionServiceList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            this.newSubServiceModel.setData({...oObject });
            this._refreshInputValidation();

            // Toggle Visibility for edit
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlUpdateSubscriptionService"));
            this.byId("ID_TitleSubService").setText(this.oResourceBundle.getText("ttlUpdateSubscriptionService"));
            this.getView().getModel().setProperty("/toggleEdit", true);
        },
        onCancelEditSubService: function(oEvent) {
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
            this.newSubServiceModel.setData({});
            this._refreshInputValidation();
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlCreateSubscriptionService"));
            this.byId("ID_TitleSubService").setText(this.oResourceBundle.getText("ttlCreateSubscriptionService"));
            this.getView().getModel().setProperty("/toggleEdit", false);
        },
        _refreshInputValidation: function() {
            const subscriptionPlanId_ID = this.byId("ID_SubscriptionPlanId");
            const serviceId_ID = this.byId("ID_ServiceId");
            const currency_ID = this.byId("ID_Currency");
            const rateType_ID = this.byId("ID_RateType");
            const rateAmount_ID = this.byId("ID_RateAmount");

            subscriptionPlanId_ID.setValueState("None").setValueStateText("");
            serviceId_ID.setValueState("None").setValueStateText("");
            currency_ID.setValueState("None").setValueStateText("");
            rateType_ID.setValueState("None").setValueStateText("");
            rateAmount_ID.setValueState("None").setValueStateText("");
        },
        setCurrencyName: function(oValue) {
            if (oValue) {
                const currency = this.currencyMasterModel.getData();
                const description = currency.find(x => x.currencyCode === oValue);
                return description.currencyLongText;
            }
        },
        setRateName: function(oValue) {
            if (oValue) {
                const rateType = JSON.parse(sessionStorage.getItem("subscriptionService")).rateType;
                const description = rateType.find(x => x.rateType === oValue);
                return description.rateDesc;
            }
        },
        setPeriodName: function(oValue) {
            if (oValue) {
                const periodType = JSON.parse(sessionStorage.getItem("subscriptionService")).periodType;
                const description = periodType.find(x => x.periodType === oValue);
                return description.periodDesc;
            }
        },
        setSubscriptionPlanName: function(oValue) {
            if (oValue) {
                const subPlanType = JSON.parse(sessionStorage.getItem("subscriptionService")).subscriptionPlansList;
                const description = subPlanType.find(x => x.subscriptionPlanId === oValue);
                return description.subscriptionPlanDesc;
            }
        },
        setServiceName: function(oValue) {
            if (oValue) {
                const serviceType = JSON.parse(sessionStorage.getItem("subscriptionService")).servicesList;
                const description = serviceType.find(x => x.serviceId === oValue);
                return description.serviceDesc;
            }
        }
    });
});