sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/ivl/optihub/ui5/model/models",
    "sap/m/MessageToast",
    "sap/m/MessageBox",

],
    function (UIComponent, Device, models, MessageToast, MessageBox) {
        "use strict";

        return UIComponent.extend("com.ivl.optihub.ui5.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");


                const shellData = sessionStorage.getItem("shellData");

                this.shellModel = new sap.ui.model.json.JSONModel();
                this.shellModel.setData(
                    shellData ? JSON.parse(shellData) : { show: false }
                );
                this.setModel(this.shellModel, "shellModel");

                if (!sessionStorage.getItem("countryMasterData") && !sessionStorage.getItem("currencyMasterData") && !sessionStorage.getItem("languageMasterData")) {
                    this.SendRequest(this, "/hub/api/v1/resource/country", "GET", {}, null, (_self, countryData, message) => {
                        sessionStorage.setItem("countryMasterData", JSON.stringify(countryData));
                        _self.SendRequest(_self, "/hub/api/v1/resource/currency", "GET", {}, null, (_self1, currencyData, message) => {
                            sessionStorage.setItem("currencyMasterData", JSON.stringify(currencyData));
                            _self1.SendRequest(_self1, "/hub/api/v1/resource/language", "GET", {}, null, (_self2, languageData, message) => {
                                sessionStorage.setItem("languageMasterData", JSON.stringify(languageData));
                            });
                        });
                    });
                }
            },
            ValidateUser: function (page) {
                const auth = sessionStorage.getItem("auth");
                if (auth) {
                    this.SendRequest(this, "/hub/api/v1/validateJWT", "GET", {
                        Authorization: "Bearer " + auth
                    }, null, (_self, data, message) => {
                        if (page === "login") {
                            _self.getRouter().navTo("dashboard");
                        }
                    });
                } else {
                    if (page != "login") {
                        window.location.replace("/index.html");

                    }
                }
            },

            SendRequest: function (_self, url, method, headers, payload, cb) {

                const auth = sessionStorage.getItem("auth");
                if (!headers.Authorization && auth) {
                    headers.Authorization = "Basic " + auth;
                }
                headers["Content-Type"] = "application/json";
                headers["Accept"] = ["text/plain", "application/json"];

                const options = {
                    url,
                    type: method,
                    headers: headers,
                };

                if (payload) {
                    options.data = payload ;
                }

                jQuery.ajax({
                    ...options,
                    success: function (response, textStatus, jqXHR) {
                        if (response.Message?.ShowMessage) {
                            const message = response?.Message;
                            if (message?.Type === "T") {
                                MessageToast.show(message.Text);
                            } else if (message?.Type === "B") {
                                MessageBox[_self.getOwnerComponent().MessageBoxType(message.Code)](message.Text);

                            }
                        }
                        if (cb) {
                            const data = response?.Data ? JSON.parse(atob(response.Data)) : null;
                            cb(_self, data, response.Message);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status === 401) {
                            sessionStorage.removeItem("auth");
                            if (window.location.hash != "") window.location.replace("/portal/webapp/index.html");
                        }
                        const message = jqXHR.responseJSON?.Message;
                        if (message?.ShowMessage) {
                            if (message.Type === "T") {
                                MessageToast.show(message.Text);
                            } else if (message.Type === "B") {
                                MessageBox[_self.getOwnerComponent().MessageBoxType(message.Code)](message.Text);
                            }
                        }
                        sap.ui.core.BusyIndicator.hide();
                    },
                });

            },

            MessageBoxType: function (type) {
                switch (type) {
                    case "S":
                        return "success";
                    case "W":
                        return "warning";
                    case "E":
                        return "error";
                    default:
                        return "alert";
                }
            }
        });
    }
);