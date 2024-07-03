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

    return Controller.extend("ivl.optihub.admindashboard.controller.Services", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;
            //i18n Resource Bundle 
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            //JSON Models
            this.serviceListModel = new JSONModel();
            this.getView().setModel(this.serviceListModel, "serviceListModel");
            this.newServiceModel = new JSONModel({});
            this.getView().setModel(this.newServiceModel, "newServiceModel");

            // toggling
            this.configModel = new JSONModel();
            this.getView().setModel(this.configModel);

            this.getView().getModel().setProperty("/toggleEdit", false);

            this.oRouter.getRoute("Services").attachPatternMatched(this._handleRouteMatched, this);
        },
        /*
         * get ID of Selected from route
         */
        _handleRouteMatched: function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            this.serviceListModel.setData({});
            this.newServiceModel.setData({});
            this._refreshInputValidation();
            this.SendRequest(this, "/admin-srv/api/v1/admin/get-service", "get", {}, null, (_self, data, message) => {
                _self.serviceListModel.setData(data);
                sap.ui.core.BusyIndicator.hide();
            });
        },
        onCreateService: function(oEvent) {
            if (this._handleInputValidation()) {
                const newServiceData = this.newServiceModel.getData(),
                    oButtonId = oEvent.getParameter("id");
                sap.ui.core.BusyIndicator.show();
                this.SendRequest(this, "/admin-srv/api/v1/admin/create-service", "post", {}, newServiceData, (_self, data, message) => {
                    _self.getView().getModel("serviceListModel").setData(data);
                    _self.onRefreshScreen();
                    if (oButtonId.includes("ID_CreateService")) {
                        MessageToast.show(this.oResourceBundle.getText("msgSucessCreate"));
                    } else {
                        MessageToast.show(this.oResourceBundle.getText("msgSucessEdit"));
                    }
                    sap.ui.core.BusyIndicator.hide();
                });
            }
        },
        _handleInputValidation: function() {
            var validate = true;
            const serviceId_ID = this.byId("ID_serviceId");
            const serviceDesc_ID = this.byId("ID_serviceDesc");
            if (serviceId_ID.getValue()) {
                serviceId_ID.setValueState("None").setValueStateText("");
            } else {
                serviceId_ID.setValueState("Error").setValueStateText("Service ID is Mandatory");
                validate = false;
            }
            if (serviceDesc_ID.getValue()) {
                serviceDesc_ID.setValueState("None").setValueStateText("");
            } else {
                serviceDesc_ID.setValueState("Error").setValueStateText("Service Description is Mandatory");
                validate = false;
            }

            return validate;
        },
        onServiceDeletePress: function(oEvent) {
            const oIndex = oEvent.getSource().getParent().getParent().getIndex(),
                oTable = this.byId("ID_ServiceList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgDeleteComfirmation"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: "OK",
                onClose: function(sAction) {
                    if (sAction == "OK") {
                        sap.ui.core.BusyIndicator.show();
                        _self.SendRequest(_self, `/admin-srv/api/v1/admin/delete-service`, "delete", {}, { "serviceId": oObject.serviceId }, (_self1, data, message) => {
                            _self1.getView().getModel("serviceListModel").setData(data);
                            _self1.onRefreshScreen();
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                }
            });
        },
        onServiceEditPress: function(oEvent) {
            const oIndex = oEvent.getParameter("row").getIndex(),
                oTable = this.byId("ID_ServiceList"),
                oObject = oTable.getContextByIndex(oIndex).getObject();
            this.newServiceModel.setData({...oObject });
            this._refreshInputValidation();

            // Toggle Visibility for edit
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlUpdateService"));
            this.byId("ID_TitleService").setText(this.oResourceBundle.getText("ttlUpdateService"));
            this.getView().getModel().setProperty("/toggleEdit", true);
        },
        onCancelEditService: function(oEvent) {
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
            this.newServiceModel.setData({});
            this._refreshInputValidation();
            this.byId("ID_CreateSection").setTitle(this.oResourceBundle.getText("ttlCreateService"));
            this.byId("ID_TitleService").setText(this.oResourceBundle.getText("ttlCreateService"));
            this.getView().getModel().setProperty("/toggleEdit", false);
        },
        _refreshInputValidation: function() {
            const serviceId_ID = this.byId("ID_serviceId");
            const serviceDesc_ID = this.byId("ID_serviceDesc");
            serviceId_ID.setValueState("None").setValueStateText("");
            serviceDesc_ID.setValueState("None").setValueStateText("");
        }
    });
});