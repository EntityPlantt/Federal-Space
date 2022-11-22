var Electron = require("electron");
function createWindow(file, settings) {
	var win = new Electron.BrowserWindow(settings);
	win.loadFile(file);
	return win;
}
Electron.app.whenReady().then(() => {
	this.indexWindow = createWindow("index.html", {
		kiosk: true,
		webPreferences: {
			devTools: true,
			safeDialogs: true
		},
		autoHideMenuBar: true
	});
});
Electron.app.on("window-all-closed", () => {
	if (process.platform != "darwin")
		Electron.app.quit();
});