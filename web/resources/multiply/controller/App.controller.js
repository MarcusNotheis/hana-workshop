/*eslint no-console: 0, no-unused-vars: 0, no-use-before-define: 0, no-redeclare: 0, no-undef: 0*/
//To use a javascript controller its name must end with .controller.js
sap.ui.define(["sap/ui/core/mvc/Controller"], function(Controller) {
	"use strict";
	return Controller.extend("sap.shineNext.xsjsMultiply.controller.App", {
		onInit: function() {
			var model = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(model);
			this.getView().addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
		},
		callMultiService: function() {
			var oTable = this.getView().byId("tblPOHeader");
			var oTableItem = this.getView().byId("tblPOItem");

			var mPath = this.getOwnerComponent().getModel().getProperty("/mPath");
			var mEntity1 = this.getOwnerComponent().getModel().getProperty("/mEntity1");
			var mEntity2 = this.getOwnerComponent().getModel().getProperty("/mEntity2");

			var oParams = {};
			oParams.json = true;
			oParams.useBatch = true;
			var oModel = new sap.ui.model.odata.v2.ODataModel(mPath, oParams);
			oModel.attachEvent("requestFailed", oDataFailed);

			function fnLoadMetadata() {
				oTable.setModel(oModel);
				oTable.setEntitySet(mEntity1);
				oTableItem.setModel(oModel);
				oTableItem.setEntitySet(mEntity2);
				var oMeta = oModel.getServiceMetadata();
				var headerFields = "";
				var itemFields = "";
				for (var i = 0; i < oMeta.dataServices.schema[0].entityType[0].property.length; i++) {
					var property = oMeta.dataServices.schema[0].entityType[0].property[i];
					headerFields += property.name + ",";
				}

				for (var i = 0; i < oMeta.dataServices.schema[0].entityType[1].property.length; i++) {
					var property = oMeta.dataServices.schema[0].entityType[1].property[i];
					itemFields += property.name + ",";
				}
				oTable.setInitiallyVisibleFields(headerFields);
				oTableItem.setInitiallyVisibleFields(itemFields);
			}

			oModel.attachMetadataLoaded(oModel, function() {
				fnLoadMetadata();
			});

			oModel.attachMetadataFailed(oModel, function() {
				sap.m.MessageBox.show("Bad Service Definition", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Service Call Error",
					actions: [sap.m.MessageBox.Action.OK],
					styleClass: "sapUiSizeCompact"
				});
			});
		},
		callExcel: function(oEvent) {
			//Excel Download
			window.open("/node/excel/download/");
			return;
		},
		onLiveChange: function(oEvent) {
			var view = this.getView();
			var result = view.getModel().getData();
			var controller = this.getView().getController();
			var valSend;
			if (oEvent.getParameters().id === "comp---app--val1") {
				valSend = result.val2;
			} else {
				valSend = result.val1;
			}
			if (valSend === undefined) {
				valSend = 0;
			}
			var aUrl = "/sap/hana/democontent/epm/services/multiply.xsjs?cmd=multiply" +
				"&num1=" + escape(oEvent.getParameters().newValue) +
				"&num2=" + escape(valSend);
			jQuery.ajax({
				url: aUrl,
				method: "GET",
				dataType: "json",
				success: controller.onCompleteMultiply,
				error: controller.onErrorCall
			});
		},

		onCompleteMultiply: function(myTxt) {
			var oResult = sap.ui.getCore().byId("comp---app--result");
			if (myTxt === undefined) {
				oResult.setText(0);
			} else {
				jQuery.sap.require("sap.ui.core.format.NumberFormat");
				var oNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({
					maxFractionDigits: 12,
					minFractionDigits: 0,
					groupingEnabled: true
				});
				oResult.setText(oNumberFormat.format(myTxt));
			}
		},
		onErrorCall: function(oError) {
			if (oError.statusCode === 500 || oError.statusCode === 400 || oError.statusCode === "500" || oError.statusCode === "400") {
				var errorRes = JSON.parse(oError.responseText);
				if (!errorRes.error.innererror) {
					sap.m.MessageBox.alert(errorRes.error.message.value);
				} else {
					if (!errorRes.error.innererror.message) {
						sap.m.MessageBox.alert(errorRes.error.innererror.toString());
					} else {
						sap.m.MessageBox.alert(errorRes.error.innererror.message);
					}
				}
				return;
			} else {
				sap.m.MessageBox.alert(oError.response.statusText);
				return;
			}

		}
	});
});