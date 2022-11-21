const {MSICreator} = require("electron-wix-msi"), path = require("path");
const os = process.argv[2], arch = process.argv[3];
var creator = new MSICreator({
	appDirectory: path.resolve(__dirname, `./Federal Space-${os}-${arch}`),
	outputDirectory: path.resolve(__dirname, "./msi"),
	description: "Take over space!",
	exe: "Federal Space",
	name: "Federal Space",
	manufacturer: "EntityPlantt &amp; FilipK",
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