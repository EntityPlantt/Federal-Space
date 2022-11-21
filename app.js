var Electron = require("electron"), path = require("path");
function createWindow(file, settings) {
	var win = new Electron.BrowserWindow(settings);
	win.loadFile(file);
	return win;
}
Electron.app.whenReady().then(() => {
	this.indexWindow = createWindow("index.html", {
		/*
		width: 600,
		height: 300,
		center: true,
		resizable: false,
		movable: false,
		frame: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		closable: false,
		autoHideMenuBar: true,
		webPreferences: {
			devTools: true,
			preload: path.join(__dirname, "index-preload.js")
		}
		*/
		kiosk: true,
		webPreferences: {
			devTools: true,
			preload: path.join(__dirname, "preload.js"),
			safeDialogs: true
		},
		autoHideMenuBar: true
	});
});
Electron.app.on("window-all-closed", () => {
	if (process.platform != "darwin")
		Electron.app.quit();
});