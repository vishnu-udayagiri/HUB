sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageBox",
        "sap/m/Popover",
        "sap/m/library",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/ui/core/Fragment",
        "sap/ui/core/Core",
        "sap/m/MessageToast", "sap/ui/model/json/JSONModel",
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller,
        MessageBox,
        Popover,
        library,
        Button,
        ButtonType,
        Fragment,
        Core,
        MessageToast, JSONModel) {
        "use strict";

        var ButtonType = library.ButtonType,
            PlacementType = library.PlacementType;

        return Controller.extend("com.ivl.optihub.ui5.controller.App", {
            onInit: async function() {
                this.oRouter = this.getOwnerComponent().getRouter();
                //AJAX send Request
                this.SendRequest = this.getOwnerComponent().SendRequest;

                this.FetchMasterData = this.getOwnerComponent().FetchMasterData;
                this.countryMasterModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this.countryMasterModel, "countryMasterModel");
                this.currencyMasterModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this.currencyMasterModel, "currencyMasterModel");
                this.languageMasterModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this.languageMasterModel, "languageMasterModel");

                this._fetchMasterData();
            },

            _fetchMasterData: function() {
                const countryMasterData = sessionStorage.getItem("countryMasterData");
                const currencyMasterData = sessionStorage.getItem("currencyMasterData");
                const languageMasterData = sessionStorage.getItem("languageMasterData");
                //Country
                if (!countryMasterData) {
                    this.SendRequest(this, "/hub/api/v1/resource/country", "GET", {}, null, (_self, countryData, message) => {
                        sessionStorage.setItem("countryMasterData", JSON.stringify(countryData));
                        _self.countryMasterModel.setData(countryData);
                        _self.countryMasterModel.setSizeLimit(countryData.length);
                    });
                } else {
                    this.countryMasterModel.setData(JSON.parse(countryMasterData));
                    this.countryMasterModel.setSizeLimit(JSON.parse(countryMasterData).length);
                }
                //Currency
                if (!currencyMasterData) {
                    this.SendRequest(this, "/hub/api/v1/resource/currency", "GET", {}, null, (_self, currencyData, message) => {
                        sessionStorage.setItem("currencyMasterData", JSON.stringify(currencyData));
                        _self.currencyMasterModel.setData(currencyData);
                        _self.currencyMasterModel.setSizeLimit(currencyData.length);
                    });
                } else {
                    this.currencyMasterModel.setData(JSON.parse(currencyMasterData));
                    this.currencyMasterModel.setSizeLimit(JSON.parse(currencyMasterData).length);
                }
                //Language
                if (!languageMasterData) {
                    this.SendRequest(this, "/hub/api/v1/resource/language", "GET", {}, null, (_self, languageData, message) => {
                        sessionStorage.setItem("languageMasterData", JSON.stringify(languageData));
                        _self.languageMasterModel.setData(languageData);
                        _self.languageMasterModel.setSizeLimit(languageData.length);
                    });
                } else {
                    this.languageMasterModel.setData(JSON.parse(languageMasterData));
                    this.languageMasterModel.setSizeLimit(JSON.parse(languageMasterData).length);
                }
            },
            _handleSettigsPress: function(event) {
                var _self = this;
                var oPopover = new Popover({
                    showHeader: false,
                    placement: PlacementType.Bottom,
                    content: [
                        new Button({
                            text: "User information",
                            type: ButtonType.Transparent,
                            icon: "sap-icon://customer",
                            press: function(oEvent) {
                                /**POP-UP to show user information */
                                _self.SendRequest(_self, "/hub/api/v1/portal/get-client-details", "GET", {}, null, (_self, data, message) => {
                                    debugger;
                                    _self.clientDetailsModel = new JSONModel(data);
                                    _self.getView().setModel(_self.clientDetailsModel, "clientDetailsModel");
                                    var oView = _self.getView();
                                    _self.oDialog = sap.ui.xmlfragment("com.ivl.optihub.ui5.view.fragments.userInfo", _self);
                                    _self.getView().addDependent(_self.oDialog);
                                    _self.oDialog.open();
                                });
                            }
                        }),
                        new Button({
                            text: "SignOut",
                            type: ButtonType.Transparent,
                            icon: "sap-icon://log",
                            press: function(oEvent) {
                                MessageBox.confirm("Are you sure you want to logout?", {
                                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                                    emphasizedAction: MessageBox.Action.OK,
                                    onClose: function(sAction) {
                                        if (sAction == "OK") {
                                            sessionStorage.clear();
                                            window.location.replace("/portal/webapp/index.html");
                                        }
                                    },
                                });
                            }
                        })
                        // ,
                        // new Button({
                        //     text: "Change Password",
                        //     type: ButtonType.Transparent,
                        //     icon: "sap-icon://private",
                        //     press: function(oEvent) {

                        //     }
                        // })
                    ]
                }).addStyleClass('sapMOTAPopover sapTntToolHeaderPopover');
                oPopover.openBy(event.getSource());
            },
            _handleDialogClose: function() {
                this.oDialog.close();
            },
            _handleDialogAfterClose: function() {
                this.oDialog.destroy();
            },
            onRefreshToken: function() {
                Core.byId("_IDGenDialog1").setBusy(true);
                this.SendRequest(this, "/hub/api/v1/portal/regenerate-credential", "POST", {}, null, (_self, data, message) => {
                    _self.SendRequest(_self, "/hub/api/v1/portal/get-client-details", "GET", {}, null, (_self, data, message) => {
                        _self.clientDetailsModel = new JSONModel(data);
                        _self.getView().setModel(_self.clientDetailsModel, "clientDetailsModel");
                        Core.byId("_IDGenDialog1").setBusy(false);
                    });
                });
            },
            onCopyToken: function() {
                var token = Core.byId("token").getText();
                navigator.clipboard.writeText(token);
                MessageToast.show("Client Secret copied")
            }
        });
    });