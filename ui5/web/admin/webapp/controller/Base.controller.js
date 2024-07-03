sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/ui/Device"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller, Device) {
        "use strict";

        return Controller.extend("ivl.optihub.admindashboard.controller.Base", {
            onInit: function() {
                this._setToggleButton();
            },
            _setToggleButton: function() {
                var oToolPage = this.byId("toolPage");
                var bSideExpanded = oToolPage.getSideExpanded();
                if (Device.system.desktop) {
                    this.byId("toolPage").setSideExpanded(bSideExpanded);
                } else {
                    this.byId("toolPage").setSideExpanded(false);
                }
            },
            onItemSelect: function(oEvent) {
                var userSelected = oEvent.getParameter("item"),
                    oKey = userSelected.getKey();
                if (!Device.system.desktop) {
                    this._setToggleButton();
                }
                this.getOwnerComponent().getRouter().navTo(oKey)
            },
            onSideNavButtonPress: function() {
                var oToolPage = this.byId("toolPage");
                var bSideExpanded = oToolPage.getSideExpanded();
                oToolPage.setSideExpanded(!bSideExpanded);
            },
        });
    });