sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Label",
    "sap/m/Input",
    "sap/ui/core/Core",
    "sap/m/ComboBox",
    "sap/m/Select",
    "sap/ui/core/library",
    "sap/m/MessageToast"
], function(
    Controller,
    JSONModel,
    Dialog,
    DialogType,
    Button,
    ButtonType,
    Label,
    Input,
    Core,
    ComboBox,
    Select,
    coreLibrary,
    MessageToast
) {
    "use strict";
    var ValueState = coreLibrary.ValueState;

    return Controller.extend("com.ivl.optihub.ui5.controller.ExtractPDF", {
        onInit: async function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;
            //Get i18n Resource Bundle
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            this.generateTempDataModel = new sap.ui.model.json.JSONModel();
            sap.ui.getCore().setModel(this.generateTempDataModel, "generateTempDataModel");
            this.docSubTypeModel = new sap.ui.model.json.JSONModel();
            sap.ui.getCore().setModel(this.docSubTypeModel, "docSubTypeModel");

            this.generateTemplateModel = new JSONModel({});
            this.newOriginatorModel = new JSONModel({});
            this.docDetailModel = new JSONModel({});
            this.getView().setModel(this.docDetailModel, "docDetailModel");
            this.originatorsModel = new JSONModel({});
            this.getView().setModel(this.originatorsModel, "originatorsModel");

            this.typeDataModel = new JSONModel();
            this.getView().setModel(this.typeDataModel, "typeDataModel");
            this.subTypeDataModel = new JSONModel();
            this.getView().setModel(this.subTypeDataModel, "subTypeDataModel");
            this.FetchMasterData = this.getOwnerComponent().FetchMasterData;
            this.countryMasterModel = new JSONModel();
            sap.ui.getCore().setModel(this.countryMasterModel, "countryMasterModel");
            this.currencyMasterModel = new JSONModel();
            sap.ui.getCore().setModel(this.currencyMasterModel, "currencyMasterModel");
            this.languageMasterModel = new JSONModel();
            sap.ui.getCore().setModel(this.languageMasterModel, "languageMasterModel");
            this._fetchMasterData();
            this._handleRouteMatched();
            // this.oRouter.getRoute("ExtractPDF").attachPatternMatched(this._handleRouteMatched, this);
        },
        _handleRouteMatched: function() {
            sap.ui.core.BusyIndicator.show();
            this.SendRequest(this, "/hub/api/v1/trainer/get-originators", "GET", {}, null, (_self, data, message) => {
                _self.originatorsModel.setData(data);
                sap.ui.core.BusyIndicator.hide();
            });
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
        onChangeOriginator: function(oEvent) {
            if (this.validateSelection(oEvent)) {
                sap.ui.core.BusyIndicator.show();
                this.byId("type").setSelectedKey("");
                this.byId("subType").setSelectedKey("");
                this.byId("fileUploader").setValue("");
                this.byId("fileUploader").setEnabled(false);
                this.byId("extractFieldsId").setEnabled(false);
                this.byId("openTrainerId").setEnabled(false);
                this.byId("subType").setEditable(false);
                this.byId("tct").setValue({});
                this.byId("sfExtractedField").setVisible(false);
                const selOriginator = oEvent.getSource().getSelectedKey();
                this.SendRequest(this, "/hub/api/v1/trainer/get-document-types?" + selOriginator, "GET", {}, null, (_self, data, message) => {
                    _self.typeDataModel.setData(data.documentTypes);
                    _self.subTypeDataModel.setData(data.documentSubTypes);
                    _self.byId("type").setEditable(true);
                    _self.byId("_btnGenerate").setEnabled(true);
                    sap.ui.core.BusyIndicator.hide();
                });
            }
        },
        onChangeDocTypes: function(oEvent) {
            const selDocType = oEvent.getSource().getSelectedKey(),
                subTypes = this.subTypeDataModel.getData(),
                oFiltSubTypes = subTypes.filter(y => y.documentTypeCode === selDocType);
            this.filtDocSubTypeModel = new JSONModel(oFiltSubTypes);
            this.getView().setModel(this.filtDocSubTypeModel, "filtDocSubTypeModel");
            this.byId("subType").setEditable(true);
        },
        onChangeDocSubTypes: function(oEvent) {
            const selDocSubType = oEvent.getSource().getSelectedKey();
            if (selDocSubType) {
                this.byId("fileUploader").setEnabled(true);
            }
        },
        onFileChange: function(oEvent) {
            this.byId("extractFieldsId").setEnabled(true);
            this.byId("openTrainerId").setEnabled(true);
        },
        /** Generate template dialog */
        onPressGenerateTemplate: function(event) {
            sap.ui.core.BusyIndicator.show();
            this.SendRequest(this, "/hub/api/v1/trainer/get-originators-and-document-types", "GET", {}, null, this._cbGetGenerateTemplateData);
        },
        _cbGetGenerateTemplateData: function(_self, data, message) {
            _self.generateTempDataModel.setData(data);
            sap.ui.getCore().setModel(_self.generateTemplateModel, "generateTemplateModel");
            _self.oGenerateTemplateDialog = new Dialog({
                type: DialogType.Message,
                title: _self.oResourceBundle.getText('ttlGenInvTemplate'),
                contentWidth: "30%",
                content: [
                    new Label({
                        text: _self.oResourceBundle.getText('txtOriginatorCode'),
                        required: true,
                        labelFor: "originatorCode"
                    }),
                    new Select("originatorCode", {
                        width: "100%",
                        forceSelection: false,
                        selectedKey: "{generateTemplateModel>/originatorCode}",
                        items: {
                            path: "generateTempDataModel>/originators",
                            template: new sap.ui.core.ListItem({
                                key: '{generateTempDataModel>originatorCode}',
                                text: '{generateTempDataModel>originatorName}'
                            }),
                            templateShareable: true,
                        },
                    }),
                    new Label({
                        text: _self.oResourceBundle.getText('txtType'),
                        required: true,
                        labelFor: "type"
                    }),
                    new Select("type", {
                        width: "100%",
                        forceSelection: false,
                        selectedKey: "{generateTemplateModel>/documentTypeCode}",
                        items: {
                            path: "generateTempDataModel>/documentTypes",
                            template: new sap.ui.core.ListItem({
                                key: '{generateTempDataModel>documentTypeCode}',
                                text: '{generateTempDataModel>documentTypeName}'
                            }),
                            templateShareable: true,
                        },
                        change: function(oEvent) {
                            const oSelType = oEvent.getSource().getSelectedKey();
                            const docSubTypes = _self.generateTempDataModel.getData().documentSubTypes;
                            const oFiltSubTypes = docSubTypes.filter(y => y.documentTypeCode === oSelType);
                            _self.docSubTypeModel.setData(oFiltSubTypes);
                            Core.byId("subType").setEditable(true);
                        }
                    }),
                    new Label({
                        text: _self.oResourceBundle.getText('txtSubType'),
                        required: true,
                        labelFor: "subType"
                    }),
                    new Select("subType", {
                        width: "100%",
                        forceSelection: false,
                        editable: false,
                        selectedKey: "{generateTemplateModel>/documentSubType}",
                        items: {
                            path: "docSubTypeModel>/",
                            template: new sap.ui.core.ListItem({
                                key: '{docSubTypeModel>documentSubType}',
                                text: '{docSubTypeModel>documentSubName}'
                            }),
                            templateShareable: true,
                        },
                    }),
                    new Label({
                        text: _self.oResourceBundle.getText('txtCountry'),
                        labelFor: "countryKey"
                    }),
                    new ComboBox("countryKey", {
                        width: "100%",
                        forceSelection: false,
                        required: true,
                        selectedKey: "{generateTemplateModel>/countryKey}",
                        items: {
                            path: "countryMasterModel>/",
                            template: new sap.ui.core.ListItem({
                                key: '{countryMasterModel>countryKey}',
                                text: '{countryMasterModel>countryName}'
                            }),
                            templateShareable: true,
                        },
                    }),
                    new Label({
                        text: _self.oResourceBundle.getText('txtDescription'),
                        labelFor: "description"
                    }),
                    new Input("description", {
                        value: "{generateTemplateModel>/description}",
                        maxLength: 100
                    }),
                ],
                beginButton: new Button("ccAddButton", {
                    text: _self.oResourceBundle.getText('txtGenerateTemplate'),
                    type: ButtonType.Emphasized,
                    press: function() {
                        if (_self.generateTemplateValidate()) {
                            const templateData = sap.ui.getCore().getModel("generateTemplateModel").getData();
                            _self.SendRequest(_self, "/hub/api/v1/trainer/create-new-template", "POST", {}, JSON.stringify(templateData), _self._cbCreateNewTemplate);
                        }
                    }.bind(_self)
                }),
                endButton: new Button({
                    text: _self.oResourceBundle.getText('txtCancel'),
                    type: "Reject",
                    press: function() {
                        _self.oGenerateTemplateDialog.destroy();
                        sap.ui.getCore().getModel("generateTemplateModel").setData({});
                    }.bind(_self)
                })
            }).addStyleClass('sapUiSizeCompact');
            sap.ui.core.BusyIndicator.hide();
            _self.oGenerateTemplateDialog.open();
        },
        /** Validate template details */
        generateTemplateValidate: function() {
            let originatorCode = Core.byId("originatorCode").getSelectedKey(),
                type = Core.byId("type").getSelectedKey(),
                subType = Core.byId("subType").getSelectedKey(),
                countryKey = Core.byId("countryKey").getSelectedKey(),
                validate = true;
            Core.byId("originatorCode").setValueState("None");
            Core.byId("type").setValueState("None");
            Core.byId("subType").setValueState("None");
            Core.byId("countryKey").setValueState("None");
            if (!originatorCode) {
                Core.byId("originatorCode").setValueState("Error");
                Core.byId("originatorCode").setValueStateText("Originator is required");
                validate = false;
            } else if (!type) {
                Core.byId("type").setValueState("Error");
                Core.byId("type").setValueStateText("Type is required");
                validate = false;
            } else if (!subType) {
                Core.byId("subType").setValueState("Error");
                Core.byId("subType").setValueStateText("Sub Type is required");
                validate = false;
            } else if (!countryKey) {
                Core.byId("countryKey").setValueState("Error");
                Core.byId("countryKey").setValueStateText("Country is required");
                validate = false;
            }
            return validate;
        },
        /**
         * @param {*} _self => this
         * @param {*} data
         * @param {*} message
         * CB for create orginator
         */
        _cbCreateNewTemplate: function(_self, data, message) {
            _self.oGenerateTemplateDialog.destroy();
            sap.ui.getCore().getModel("generateTemplateModel").setData({});
        },
        /** Create originator dialog */
        onPressCreateOriginator: function(event) {
            sap.ui.getCore().setModel(this.newOriginatorModel, "newOriginatorModel");
            this.oCreateOriginatorDialog = new Dialog({
                type: DialogType.Message,
                title: this.oResourceBundle.getText('txtCreateOriginator'),
                contentWidth: "30%",
                content: [
                    new Label({
                        text: this.oResourceBundle.getText('txtOriginatorCode'),
                        labelFor: "newOriginatorCode"
                    }),
                    new Input("newOriginatorCode", {
                        required: true,
                        value: "{newOriginatorModel>/originatorCode}",
                        maxLength: 20,
                        type: "Text"
                    }),
                    new Label({
                        text: this.oResourceBundle.getText('txtOriginatorname'),
                        labelFor: "newOriginatorName"
                    }),
                    new Input("newOriginatorName", {
                        required: true,
                        value: "{newOriginatorModel>/originatorName}",
                        maxLength: 100,
                        type: "Text"
                    }),
                    new Label({
                        text: this.oResourceBundle.getText('txtCountry'),
                        labelFor: "countryKey"
                    }),
                    new sap.m.ComboBox("countryKey", {
                        width: "100%",
                        forceSelection: false,
                        selectedKey: "{newOriginatorModel>/countryKey}",
                        items: {
                            path: "countryMasterModel>/",
                            template: new sap.ui.core.ListItem({
                                key: '{countryMasterModel>countryKey}',
                                text: '{countryMasterModel>countryName}'
                            }),
                            templateShareable: true,
                        },
                    }),
                    new Label({
                        text: this.oResourceBundle.getText('txtEmail'),
                        labelFor: "email"
                    }),
                    new Input("email", {
                        required: true,
                        value: "{newOriginatorModel>/email}",
                        maxLength: 241,
                        type: "Email"
                    })
                ],
                beginButton: new Button("ccAddButton", {
                    text: this.oResourceBundle.getText('txtCreateOriginator'),
                    type: ButtonType.Emphasized,
                    press: function() {
                        if (this.originatorValidate()) {
                            const newOriginatorData = sap.ui.getCore().getModel("newOriginatorModel").getData();
                            this.SendRequest(this, "/hub/api/v1/trainer/create-originator", "POST", {}, JSON.stringify(newOriginatorData), this._cbCreateNewOriginator);
                        }
                    }.bind(this)
                }),
                endButton: new Button({
                    text: this.oResourceBundle.getText('txtCancel'),
                    type: "Reject",
                    press: function() {
                        this.oCreateOriginatorDialog.destroy();
                        sap.ui.getCore().getModel("newOriginatorModel").setData({});
                    }.bind(this)
                })
            }).addStyleClass('sapUiSizeCompact');
            this.oCreateOriginatorDialog.open();
        },
        /**
         * @param {*} _self => this
         * @param {*} data
         * @param {*} message
         * CB for create orginator
         */
        _cbCreateNewOriginator: function(_self, data, message) {
            _self._handleRouteMatched()
            _self.oCreateOriginatorDialog.destroy();
            sap.ui.getCore().getModel("newOriginatorModel").setData({});
        },
        /** Validate orginator details */
        originatorValidate: function() {
            let originatorCode = Core.byId("newOriginatorCode").getValue(),
                originatorName = Core.byId("newOriginatorName").getValue(),
                countryKey = Core.byId("countryKey").getSelectedKey(),
                email = Core.byId("email").getValue(),
                validate = true;
            Core.byId("newOriginatorCode").setValueState("None");
            Core.byId("newOriginatorName").setValueState("None");
            Core.byId("countryKey").setValueState("None");
            Core.byId("email").setValueState("None");
            if (!originatorCode) {
                Core.byId("newOriginatorCode").setValueState("Error");
                Core.byId("newOriginatorCode").setValueStateText(this.oResourceBundle.getText('txtOrgCodeRequired'));
                validate = false;
            } else if (!originatorName) {
                Core.byId("newOriginatorName").setValueState("Error");
                Core.byId("newOriginatorName").setValueStateText(this.oResourceBundle.getText('txtOrgNameRequired'));
                validate = false;
            } else if (!countryKey) {
                Core.byId("countryKey").setValueState("Error");
                Core.byId("countryKey").setValueStateText(this.oResourceBundle.getText('txtOrgCountryRequired'));
                validate = false;
            } else if (!email) {
                Core.byId("email").setValueState("Error");
                Core.byId("email").setValueStateText(this.oResourceBundle.getText('txtOrgEmailRequired'));
                validate = false;
            } else if (email) {
                validate = this.emailValidator(email);
            }
            return validate;
        },
        /** Email format validator */
        emailValidator: function(email) {
            const validEmailRegex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
            if (email.match(validEmailRegex)) {
                return true;
            } else {
                Core.byId("email").setValueState("Error");
                Core.byId("email").setValueStateText(this.oResourceBundle.getText('txtInvalidEmailFormat'));
                return false;
            }
        },
        /**
         * Extract PDF fields
         * @param {*} oEvent 
         */
        onExtractFields: async function(oEvent) {
            sap.ui.core.BusyIndicator.show();
            const oFileUploader = this.getView().byId("fileUploader");
            const file = oFileUploader.FUEl.files[0];
            const base64 = await this.convertPdfToBase64(file);
            const docDetails = this.getView().getModel("docDetailModel").getData();
            docDetails.base64File = base64;
            this.SendRequest(this, "/hub/api/v1/trainer/extract-fields-portal", "POST", {}, JSON.stringify(docDetails), this._cbExtractFields);
        },
        /**
         * @param {*} _self => this
         * @param {*} data
         * @param {*} message
         * CB for Extarct fields
         */
        _cbExtractFields: function(_self, data, message) {
            var data = JSON.stringify(data, null, 4);
            _self.byId("tct").setValue(data);
            _self.byId("sfExtractedField").setVisible(true);
            sap.ui.core.BusyIndicator.hide();
        },
        /** Open Trainer */
        onOpenTrainer: async function() {
            this.oRouter.navTo("Trainer");
            const oFileUploader = this.getView().byId("fileUploader");
            const file = oFileUploader.FUEl.files[0];
            const base64 = await this.convertPdfToBase64(file);
            const docDetails = this.getView().getModel("docDetailModel").getData();
            docDetails.base64File = base64;
            sessionStorage.setItem('originalDocumentDetails', JSON.stringify(docDetails));
        },
        /**
         * Convert PDF to Base64
         * @param {*} file 
         * @returns 
         */
        convertPdfToBase64: async function(file) {
            return new Promise((resolve, reject) => {
                var reader = new FileReader();
                reader.onload = function(e) {
                    resolve(e.target.result
                        .replace('data:', '')
                        .replace(/^.+,/, ''));
                };
                reader.readAsDataURL(file);
            })
        },
        validateSelection: function(oEvent) {
            var oValidatedComboBox = oEvent.getSource(),
                sSelectedKey = oValidatedComboBox.getSelectedKey(),
                sValue = oValidatedComboBox.getValue();

            if (!sSelectedKey && sValue) {
                oValidatedComboBox.setValueState("Error");
                oValidatedComboBox.setValueStateText(this.oResourceBundle.getText('msgSelctionValidate'));
                return false;
            } else {
                oValidatedComboBox.setValueState(ValueState.None);
                return true;
            }
        },
        copyJson: function() {
            var token = this.byId("tct").getValue();
            navigator.clipboard.writeText(token);
            MessageToast.show("JSON copied")
        }
    });
});