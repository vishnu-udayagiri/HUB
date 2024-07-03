sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "ivl/optihub/admindashboard/model/models",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    function (UIComponent,
	Device,
	models,
	MessageToast,
	MessageBox) {
        "use strict";

        return UIComponent.extend("ivl.optihub.admindashboard.Component", {
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
            SendRequest: async function (_self, url, method, headers, payload, cb) {

                const options = {
                    url,
                    type: method
                };

                if (method === "post" || method === "POST" || method === "delete" || method === "DELETE") {
                    const x_csrf = await _self.getOwnerComponent().getXCSRFToken();
                    if (x_csrf) {
                        headers["X-CSRF-Token"] = x_csrf;
                        options.headers =  headers;
                    }
                }

                if (payload) {
                    options.data = payload;
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
                            if (window.location.hash != "") window.location.replace("/index.html");
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
            getXCSRFToken:  async function () {
                return new Promise((resolve, reject) => {
                jQuery.ajax({
                    url: "/admin-srv/api/v1/admin/csrf-token",
                    type: "GET",
                    headers: {
                        "X-CSRF-Token": "fetch"
                    },
                    success: function (data, status, xhr) {
                        resolve(xhr.getResponseHeader("X-CSRF-Token"));
                    },
                    error: function (err) { }
                });
            })
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