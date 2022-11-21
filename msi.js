const {MSICreator} = require("electron-wix-msi"), path = require("path");
var creator = new MSICreator({
	appDirectory: path.resolve(__dirname, "./Federal Space-win32-x64"),
	outputDirectory: path.resolve(__dirname, "./msi"),
	description: "Take over space!",
	exe: "Federal Space",
	name: "Federal Space",
	manufacturer: "Fnikipp",
	version: "1.0.0",
	appIconPath: "images/icon.ico",
	ui: {
		chooseDirectory: true,
		images: {
			background: path.resolve(__dirname, "./images/msi/background.png")
		}
	}
});
creator.create().then(() => creator.compile());