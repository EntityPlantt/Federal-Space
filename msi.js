const {MSICreator} = require("electron-wix-msi"), path = require("path");
const settings = require(path.join(__dirname, "package.json"));
const os = process.argv[2], arch = process.argv[3];
var creator = new MSICreator({
	appDirectory: path.resolve(__dirname, `./Federal Space-${os}-${arch}`),
	outputDirectory: path.resolve(__dirname, "./msi"),
	description: settings.description,
	exe: "Federal Space",
	name: settings.name,
	manufacturer: "EntityPlantt &amp; FilipK",
	version: settings.version.substr(2),
	appIconPath: "images/icon.ico",
	ui: {
		chooseDirectory: true,
		images: {
			background: path.resolve(__dirname, "./images/msi/background.png"),
			banner: path.resolve(__dirname, "./images/msi/banner.png")
		}
	}
});
creator.create().then(() => creator.compile());