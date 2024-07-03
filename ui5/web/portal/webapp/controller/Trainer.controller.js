sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Core",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function(
    Controller,
    JSONModel,
    Core,
    MessageBox, MessageToast
) {
    "use strict";

    return Controller.extend("com.ivl.optihub.ui5.controller.Trainer", {
        onInit: function() {
            this.oRouter = this.getOwnerComponent().getRouter();
            //AJAX send Request
            this.SendRequest = this.getOwnerComponent().SendRequest;

            //i18n Resource Bundle 
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            this.trainerModel = new JSONModel();
            this.getView().setModel(this.trainerModel, "trainerModel");
            this.trainSelectedModel = new JSONModel();
            this.getView().setModel(this.trainSelectedModel, "trainSelectedModel");

            this.configModel = new JSONModel();
            this.getView().setModel(this.configModel);

            this.oRouter.getRoute("Trainer").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function() {
            sap.ui.core.BusyIndicator.show();
            this.getView().getModel().setProperty("/toggleDateVisible", false);
            this.onAddPress = false;
            const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
            this.trainerModel = new JSONModel();
            this.getView().setModel(this.trainerModel, "trainerModel")
            this.SendRequest(this, "/hub/api/v1/extractor/convert-pdf-to-text", "POST", {}, JSON.stringify(originalDocumentDetails), this._cbExtractFields);
        },
        /**
         * @param {*} _self => this
         * @param {*} data
         * @param {*} message
         * CB for Extarct fields
         */
        _cbExtractFields: function(_self, data, message) {
            const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
            const docData = {
                originatorCode: originalDocumentDetails.originatorCode,
                documentTypeCode: originalDocumentDetails.documentTypeCode,
                documentSubType: originalDocumentDetails.documentSubType
            }
            _self.SendRequest(_self, "/hub/api/v1/trainer/get-trained-fields", "POST", {}, JSON.stringify(docData), _self._cbGetTrainedFields);

            _self.byId("txtFile").setText(data.text);
            sessionStorage.setItem("orginalPdfToText", data.text)
        },
        /**
         * CB for get trained fields
         * @param {*} _self => this
         * @param {*} data  => response
         * @param {*} message => response message
         */
        _cbGetTrainedFields: function(_self, data, message) {
            sap.ui.core.BusyIndicator.hide();
            _self.trainerModel.setData(data)
        },
        /**
         * Get Detailed View of selected Field
         * @param {*} oEvent 
         */
        onPressDetailView: function(oEvent) {
            const obj = oEvent.getParameter("rowBindingContext");
            const rowIndex = oEvent.getParameters().rowIndex;
            if (this.onAddPress) {
                var _self = this;
                MessageBox.confirm(this.oResourceBundle.getText("msgConfirmCancelCreate"), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function(sAction) {
                        if (sAction == "OK") {
                            _self.onAddPress = false;
                            _self.byId("fieldSelectId").setVisible(false);
                            _self.byId("fieldId").setVisible(true);
                            _self.onDetailView(obj, rowIndex);
                        }
                    },
                });
            } else {
                this.onDetailView(obj, rowIndex);
            }
        },
        onDetailView: function(obj, rowIndex) {
            this.byId("_IDGenLabel11").setVisible(false);
            this.byId("_IDGenScrollContainer1").setVisible(false);
            this.byId("_IDGenVerticalLayout1").setEnabled(true);
            this.byId("_IDGenUploadButton").setVisible(false);
            this.byId("_IDGenSaveButton").setVisible(false);
            this.byId("fieldId").setValueState("None");
            this.byId("_IDGenInput1").setValueState("None");
            this.byId("_IDGenInput2").setValueState("None");
            this.byId("_IDGenTextArea1").setValueState("None");
            this.byId("_IDGenInput3").setValueState("None");
            const aData = obj.getObject();
            const extractedData = this.trainerModel.getData();
            const vbox = this.byId("_IDGenHBox5");
            vbox.removeAllItems();
            const extractedFieldData = extractedData.find(x => x.fieldId === aData.fieldId);
            if (extractedFieldData) {
                const fieldTemplate = JSON.parse(extractedFieldData.fieldTemplate);
                if (fieldTemplate) {
                    extractedFieldData.startLabel = fieldTemplate.startLabel;
                    extractedFieldData.endLabel = fieldTemplate.endLabel;
                    extractedFieldData.index = fieldTemplate.index;
                    extractedFieldData.pattern = fieldTemplate.pattern;
                    extractedFieldData.replace = fieldTemplate.replace;
                    extractedFieldData.isDate = fieldTemplate.isDate;
                    extractedFieldData.dateFormat = fieldTemplate.dateFormat;
                    extractedFieldData.dateToFormat = fieldTemplate.dateToFormat;
                    if (fieldTemplate.isDate) {
                        this.getView().getModel().setProperty("/toggleDateVisible", true);
                    } else {
                        this.getView().getModel().setProperty("/toggleDateVisible", false);
                    }
                    this.byId("_IDBtnTestTemplate").setVisible(true);
                }
            }
            this.byId("extractFieldsTable").setSelectedIndex(rowIndex);
            this.trainSelectedModel.setData(extractedFieldData);
        },
        onDeleteField: function(oEvent) {
            /**Confirm to Delete Extracted Field */
            var oTable = this.getView().byId("extractFieldsTable");
            var idx = oEvent.getParameter("row").getIndex();
            var model = oTable.getModel("trainerModel");
            var _self = this;
            MessageBox.confirm(this.oResourceBundle.getText("msgDeleteField"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function(sAction) {
                    if (sAction == "OK") {
                        sap.ui.core.BusyIndicator.show();
                        debugger
                        const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
                        var fieldsData = model.getData();
                        var selData = fieldsData[idx];
                        let reqData = {};
                        reqData.originatorCode = originalDocumentDetails.originatorCode;
                        reqData.documentTypeCode = originalDocumentDetails.documentTypeCode;
                        reqData.documentSubType = originalDocumentDetails.documentSubType;
                        reqData.fieldId = selData.fieldId;
                        _self.SendRequest(_self, "/hub/api/v1/trainer/delete-trained-fields", "DELETE", {}, JSON.stringify(reqData), (_self, data, message) => {
                            fieldsData.splice(idx, 1);
                            model.setData(fieldsData);
                            _self.trainSelectedModel.setData({});
                            MessageToast.show(message.Text);
                            sap.ui.core.BusyIndicator.hide();
                        });
                    }
                },
            });
        },
        /**Test template */
        onTestTemplate: function(oEvent) {
            if (this._handleValidation()) {
                sap.ui.core.BusyIndicator.show();
                const selectedFeildData = this.trainSelectedModel.getData();
                const text = sessionStorage.getItem("orginalPdfToText");
                const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
                const reqData = {
                    startLabel: selectedFeildData.startLabel,
                    endLabel: selectedFeildData.endLabel,
                    pattern: selectedFeildData.pattern,
                    replace: selectedFeildData.replace,
                    text: text
                }
                if (selectedFeildData.isDate) {
                    reqData.isDate = selectedFeildData.isDate;
                    reqData.dateFormat = selectedFeildData.dateFormat;
                    reqData.dateToFormat = selectedFeildData.dateToFormat;
                } else {
                    reqData.isDate = selectedFeildData.isDate;
                }
                if (selectedFeildData.isLineItem) {
                    reqData.originatorCode = originalDocumentDetails.originatorCode;
                    reqData.documentTypeCode = originalDocumentDetails.documentTypeCode;
                    reqData.documentSubType = originalDocumentDetails.documentSubType;
                    this.SendRequest(this, "/hub/api/v1/extractor/extract-item-values", "POST", {}, JSON.stringify(reqData), this._cbTestItemTemplate);
                } else {
                    this.SendRequest(this, "/hub/api/v1/extractor/extract-header-values", "POST", {}, JSON.stringify(reqData), this._cbTestTemplate);
                }
            }
        },
        /**
         * Test Header Values and generate objectNumber for possible index
         * @param {*} _self => this
         * @param {*} data  => response
         * @param {*} message => response message
         */
        _cbTestTemplate: function(_self, data, message) {
            if (data.length > 0) {
                const HBox = _self.byId("_IDGenHBox5");
                HBox.focus();
                HBox.removeAllItems();
                _self.indexModel = new JSONModel(data);
                _self.getView().setModel(_self.indexModel, "indexModel");
                for (let k = 0; k < data.length; k++) {
                    const element = data[k];
                    var objectNumber = new sap.m.ObjectNumber({
                        number: element.index,
                        unit: ":" + element.value,
                        state: sap.ui.core.ValueState.Information,
                        inverted: true,
                        active: true,
                        press: function(oEvent) {
                            const selIndex = oEvent.getSource().getNumber();
                            _self.byId("_IDGenInput3").setValue(selIndex);
                        }
                    });
                    if (element.value.length > 25) {
                        objectNumber.addStyleClass("sapUiTinyMarginEnd widthForLargeObjectNumber");
                    } else {
                        objectNumber.addStyleClass("sapUiTinyMarginEnd widthForObjectNumber");
                    }
                    HBox.addItem(objectNumber)

                }
                _self.byId("_IDGenLabel11").setVisible(true);
                _self.byId("_IDGenScrollContainer1").setVisible(true);
                if (!_self.onAddPress) {
                    _self.byId("_IDGenUploadButton").setVisible(true);
                } else {
                    _self.byId("_IDGenSaveButton").setVisible(true);
                }
            }
            sap.ui.core.BusyIndicator.hide();
        },
        /**
         * Test Item Values and generate objectNumber for possible index
         * @param {*} _self => this
         * @param {*} data  => response
         * @param {*} message => response message
         * 
         */
        _cbTestItemTemplate: function(_self, data, message) {
            if (Object.keys(data).length > 0) {
                const HBox = _self.byId("_IDGenHBox5");
                HBox.focus();
                HBox.removeAllItems();
                _self.indexModel = new JSONModel(data);
                _self.getView().setModel(_self.indexModel, "indexModel");
                const rowNames = Object.keys(data);
                rowNames.forEach(x => {
                    const label = x;
                    var initVBox = new sap.m.VBox({});
                    var itemLabel = new sap.m.Label({
                        text: label
                    });
                    initVBox.addItem(itemLabel);
                    const rowArray = data[label];
                    for (let k = 0; k < rowArray.length; k++) {
                        const element = rowArray[k];
                        var objectNumber = new sap.m.ObjectNumber({
                            number: element.index,
                            unit: ":" + element.value,
                            state: sap.ui.core.ValueState.Information,
                            inverted: true,
                            active: true,
                            press: function(oEvent) {
                                const selIndex = oEvent.getSource().getNumber();
                                _self.byId("_IDGenInput3").setValue(selIndex);
                            }
                        });
                        if (element.value.length > 25) {
                            objectNumber.addStyleClass("sapUiTinyMarginEnd widthForLargeObjectNumber");
                        } else {
                            objectNumber.addStyleClass("sapUiTinyMarginEnd widthForObjectNumber");
                        }
                        initVBox.addItem(objectNumber);

                        HBox.addItem(initVBox);
                    }
                });
                _self.byId("_IDGenLabel11").setVisible(true);
                _self.byId("_IDGenScrollContainer1").setVisible(true);
                if (!_self.onAddPress) {
                    _self.byId("_IDGenUploadButton").setVisible(true);
                } else {
                    _self.byId("_IDGenSaveButton").setVisible(true);
                }
            }
            sap.ui.core.BusyIndicator.hide();
        },
        /** Update Template */
        onUpdateTemplate: function() {
            sap.ui.core.BusyIndicator.show();
            const selectedFeildData = this.trainSelectedModel.getData();
            const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
            const reqData = {
                originatorCode: originalDocumentDetails.originatorCode,
                documentTypeCode: originalDocumentDetails.documentTypeCode,
                documentSubType: originalDocumentDetails.documentSubType,
                fieldId: selectedFeildData.fieldId,
                description: selectedFeildData.description,
                fieldTemplate: {
                    startLabel: selectedFeildData.startLabel,
                    endLabel: selectedFeildData.endLabel,
                    pattern: selectedFeildData.pattern,
                    replace: selectedFeildData.replace,
                    index: selectedFeildData.index
                },
                isLineItem: selectedFeildData.isLineItem
            }
            if (selectedFeildData.isDate) {
                reqData["fieldTemplate"].dateFormat = selectedFeildData.dateFormat;
                reqData["fieldTemplate"].dateToFormat = selectedFeildData.dateToFormat;
                reqData["fieldTemplate"].isDate = selectedFeildData.isDate;
            } else {
                reqData["fieldTemplate"].isDate = selectedFeildData.isDate;
            }
            this.SendRequest(this, "/hub/api/v1/trainer/update-template-field", "POST", {}, JSON.stringify(reqData), this._cbUpdateTemplate);
        },
        /**
         * CB for Update Template
         * @param {*} _self => this
         * @param {*} data  => response
         * @param {*} message => response message
         */
        _cbUpdateTemplate: function(_self, data, message) {
            const originalDocumentDetails = JSON.parse(sessionStorage.getItem("originalDocumentDetails"));
            const docData = {
                originatorCode: originalDocumentDetails.originatorCode,
                documentTypeCode: originalDocumentDetails.documentTypeCode,
                documentSubType: originalDocumentDetails.documentSubType
            }
            _self.SendRequest(_self, "/hub/api/v1/trainer/get-trained-fields", "POST", {}, JSON.stringify(docData), _self._cbGetTrainedFields);
            // _self.byId("txtFile").setText(data.text);
            // sessionStorage.setItem("orginalPdfToText", data.text)
            MessageToast.show("Template Updated")
            sap.ui.core.BusyIndicator.hide();
        },
        /**
         * toggle Fields to create field
         */
        onAddNewField: function() {
            if (!this.onAddPress) {
                this.byId("_IDGenBlockLayoutCell2").setBusy(true);
                this.onAddPress = true;
                this.SendRequest(this, "/hub/api/v1/trainer/get-field-ids", "GET", {}, null, (_self, data, message) => {
                    _self.fieldIdModel = new JSONModel(data);
                    _self.getView().setModel(_self.fieldIdModel, "fieldIdModel");
                    _self.byId("fieldSelectId").setVisible(true);
                    _self.byId("fieldId").setVisible(false);
                    _self.byId("_IDGenPanel2").setHeaderText(_self.oResourceBundle.getText("ttlCreateNewField"));
                    // _self.byId("fieldId").setEditable(true);
                    _self.trainSelectedModel.setData({});
                    _self.trainSelectedModel.refresh();
                    _self.getView().getModel().setProperty("/toggleDateVisible", false);
                    _self.byId("_IDGenUploadButton").setVisible(false);
                    _self.byId("_IDGenLabel11").setVisible(false);
                    _self.byId("_IDGenScrollContainer1").setVisible(false);
                    _self.byId("_IDGenVerticalLayout1").setEnabled(true);
                    _self.byId("_IDBtnTestTemplate").setVisible(true);
                    _self.byId("_IDGenBlockLayoutCell2").setBusy(false);

                });
            }
        },
        /**
         * 
         * @returns validated
         */
        _handleValidation: function() {
            var validated = true;
            const fieldId = this.byId("fieldId"),
                selFieldID = this.byId("fieldSelectId"),
                startLabel = this.byId("_IDGenInput1"),
                endLabel = this.byId("_IDGenInput2"),
                pattern = this.byId("_IDGenTextArea1"),
                index = this.byId("_IDGenInput3");
            if (fieldId.getValue()) {
                fieldId.setValueState("None");
            } else {
                fieldId.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgFieldIdMandatory'));
                validated = false;
            }
            if (selFieldID.getSelectedKey()) {
                selFieldID.setValueState("None");
            } else {
                selFieldID.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgFieldIdMandatory'));
                validated = false;
            }
            // if (startLabel.getValue()) {
            //     startLabel.setValueState("None");
            // } else {
            //     startLabel.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgStartLabelMandatory'));
            //     validated = false;
            // }
            // if (endLabel.getValue()) {
            //     endLabel.setValueState("None");
            // } else {
            //     endLabel.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgEndLabelMandatory'));
            //     validated = false;
            // }
            if (pattern.getValue()) {
                pattern.setValueState("None");
            } else {
                pattern.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgPatternMandatory'));
                validated = false;
            }
            // if (index.getValue()) {
            //     index.setValueState("None");
            // } else {
            //     index.setValueState("Error").setValueStateText(this.oResourceBundle.getText('msgIndexMandatory'));
            //     validated = false;
            // }
            return validated;
        },
        onSelectIsDate: function(oEvent) {
            let isSelected = oEvent.getSource().getSelected();
            if (isSelected) {
                this.getView().getModel().setProperty("/toggleDateVisible", true);
            } else {
                this.getView().getModel().setProperty("/toggleDateVisible", false);
            }
        }
    });
});