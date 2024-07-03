sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"],
    function(Controller,
        JSONModel,
        MessageBox) {
        "use strict";
        return Controller.extend("ivl.optihub.admindashboard.controller.Clients", {
            onInit: function() {
                this.oRouter = this.getOwnerComponent().getRouter();
                //AJAX send Request
                this.SendRequest = this.getOwnerComponent().SendRequest;
                //i18n Resource Bundle 
                this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                const newClientModelData = {
                    "thresholdAmount": 0,
                    "isBlocked": false
                };
                //JSON Models
                this.newClientModel = new JSONModel(newClientModelData);
                this.getView().setModel(this.newClientModel, "newClientModel");
                this.clientListModel = new JSONModel();
                this.getView().setModel(this.clientListModel, "clientListModel");
                this.ClientModel = new JSONModel();
                this.getView().setModel(this.ClientModel, "ClientModel");

                // toggling
                this.configModel = new JSONModel();
                this.getView().setModel(this.configModel);

                this.getView().getModel().setProperty("/toggleEdit", false);
                this.countryMasterModel = new sap.ui.model.json.JSONModel();
                this.currencyMasterModel = new sap.ui.model.json.JSONModel();
                this.languageMasterModel = new sap.ui.model.json.JSONModel();

                this.oRouter.getRoute("Clients").attachPatternMatched(this._handleRouteMatched, this);
            },
            /*
             * get ID of Selected from route
             */
            _handleRouteMatched: function(oEvent) {
                sap.ui.core.BusyIndicator.show();
                this.newClientModel.setData({});
                this.clientListModel.setData({});
                this._refreshInputValidation();
                this._fetchMasterData();
                this.SendRequest(this, "/admin-srv/api/v1/admin/get-hub-clients", "get", {}, null, (_self, data, message) => {
                    _self.clientListModel.setData(data.clientList);
                    sessionStorage.setItem("clients", JSON.stringify(data));
                    _self.ClientModel.setData(data);
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
            onCreateClient: function(oEvent) {
                if (this._handleInputValidation()) {
                    sap.ui.core.BusyIndicator.show();
                    const newClientData = this.newClientModel.getData();
                    let logo;
                    if (this.logo) {
                        logo = this.logo;
                    } else {
                        logo = "";
                    }
                    newClientData.logo = logo;
                    this.SendRequest(this, "/admin-srv/api/v1/admin/create-client", "post", {}, newClientData, (_self, data, message) => {
                        _self.getView().getModel("clientListModel").setData(data);
                        _self.newClientModel.setData({});
                        _self.byId("ID_CreateSection").setTitle(_self.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
                        _self.byId("ID_TitleClient").setText(_self.oResourceBundle.getText("ttlCreateSubscriptionPlan"));
                        _self.getView().getModel().setProperty("/toggleEdit", false);
                        sap.ui.core.BusyIndicator.hide();
                    });
                }
            },
            _handleInputValidation: function() {
                var validate = true;
                const clientName_ID = this.byId("ID_ClientName");
                const countryKey_ID = this.byId("ID_CountryKey");
                const language_ID = this.byId("ID_Language");
                const maxNoUsers_ID = this.byId("ID_MaxNoUsers");
                const clientEmail_ID = this.byId("ID_ClientEmail");
                if (clientName_ID.getValue()) {
                    clientName_ID.setValueState("None").setValueStateText("");
                } else {
                    clientName_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgClientNameMandatory"));
                    validate = false;
                }
                if (countryKey_ID.getSelectedKey()) {
                    countryKey_ID.setValueState("None").setValueStateText("");
                } else {
                    countryKey_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgCountryMandatory"));
                    validate = false;
                }
                if (language_ID.getSelectedKey()) {
                    language_ID.setValueState("None").setValueStateText("");
                } else {
                    language_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgLanguageMandatory"));
                    validate = false;
                }
                if (maxNoUsers_ID.getValue()) {
                    maxNoUsers_ID.setValueState("None").setValueStateText("");
                } else {
                    maxNoUsers_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgMaxNoUsersMandatory"));
                    validate = false;
                }
                if (clientEmail_ID.getValue()) {
                    clientEmail_ID.setValueState("None").setValueStateText("");
                    let emailValidated = this._handleEmailValidate(clientEmail_ID.getValue(), clientEmail_ID);
                    if (!emailValidated) {
                        validate = emailValidated;
                    }
                } else {
                    clientEmail_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgClientEmailMandatory"));
                    validate = false;
                }

                return validate;
            },
            _handleEmailValidate: function(email, id) {
                debugger;
                var validEmailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
                var emailValidate = email.match(validEmailRegex);
                if (emailValidate) {
                    id.setValueState("None");
                    // const clientList = this.getView().getModel("clientListModel").getData();
                    // const ifFound = clientList.find(x => x.userId === email);
                    // if (ifFound > 0) {
                    //     clientEmail_ID.setValueState("Error").setValueStateText(this.oResourceBundle.getText("msgClientEmailExists"));
                    //     return false;
                    // }
                    return true;
                } else {
                    id.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgInvalidEmailFormat'));
                    return false;
                }
            },
            onImageUpload: function(oEvent) {
                debugger;
                const file = oEvent.getSource().FUEl.files[0];
                var _self = this;
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var data = e.target.result;
                        _self.logo = data;
                        _self.getView().byId("ID_LogoPreview").setSrc(data);
                    };
                    reader.readAsDataURL(file);
                } else {
                    _self.logo = undefined;
                    _self.getView().byId("ID_LogoPreview").setSrc("");
                }
            },
            onFileSizeExceed: function(oEvent) {
                MessageToast.show(`Upload a file of maximum size 2MB`);
            },
            onClientDeletePress: function(oEvent) {
                const oIndex = oEvent.getSource().getParent().getParent().getIndex(),
                    oTable = this.byId("ID_ClientList"),
                    oObject = oTable.getContextByIndex(oIndex).getObject();
                const reqData = {
                    "clientId": oObject.clientId
                }
                var _self = this;
                MessageBox.confirm(this.oResourceBundle.getText("msgDeleteComfirmation"), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: "OK",
                    onClose: function(sAction) {
                        if (sAction == "OK") {
                            sap.ui.core.BusyIndicator.show();
                            _self.SendRequest(_self, `/admin-srv/api/v1/admin/delete-client`, "delete", {}, reqData, (_self1, data, message) => {
                                _self1.getView().getModel("clientListModel").setData(data);
                                _self1.onRefreshScreen();
                                sap.ui.core.BusyIndicator.hide();
                            });
                        }
                    }
                });
            },
            onClientEditPress: function(oEvent) {
                const oIndex = oEvent.getSource().getParent().getParent().getIndex(),
                    oTable = this.byId("ID_ClientList"),
                    oObject = oTable.getContextByIndex(oIndex).getObject();

                if (!oObject.thresholdAmount) oObject.thresholdAmount = 0;
                if (!oObject.isBlocked) oObject.isBlocked = false;
                oObject.isUpdate = true;
                this.newClientModel.setData({...oObject });
                this._refreshInputValidation();
                // Toggle Visibility for edit
                this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlUpdateClient"));
                this.byId("ID_TitleClient").setText(this.oResourceBundle.getText("ttlUpdateClient"));
                this.getView().getModel().setProperty("/toggleEdit", true);
            },
            onCancelEditClient: function(oEvent) {
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
                this.newClientModel.setData({});
                this.byId("ID_BlockReason").setVisible(false);
                this._refreshInputValidation();
                this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlCreateClient"));
                this.byId("ID_TitleClient").setText(this.oResourceBundle.getText("ttlCreateClient"));
                this.getView().getModel().setProperty("/toggleEdit", false);
            },
            _refreshInputValidation: function() {
                const clientName_ID = this.byId("ID_ClientName");
                const countryKey_ID = this.byId("ID_CountryKey");
                const language_ID = this.byId("ID_Language");
                const maxNoUsers_ID = this.byId("ID_MaxNoUsers");
                const clientEmail_ID = this.byId("ID_ClientEmail");

                clientName_ID.setValueState("None").setValueStateText("");
                countryKey_ID.setValueState("None").setValueStateText("");
                language_ID.setValueState("None").setValueStateText("");
                maxNoUsers_ID.setValueState("None").setValueStateText("");
                clientEmail_ID.setValueState("None").setValueStateText("");
            },

            /**Code-->Description */
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
            },
            setLanguageName: function(oValue) {
                if (oValue) {
                    const language = this.languageMasterModel.getData();
                    const description = language.find(x => x.languageCode === oValue);
                    return description.languageName;
                }
            },
            setBlockReason: function(oValue) {
                if (oValue) {
                    const country = this.ClientModel.getData().blockReason;
                    const description = country.find(x => x.blockReasonCode === oValue);
                    return description.blockReasonDesc;
                }
            },
        });
    });