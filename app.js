var Electron = require("electron");
function createWindow() {
	var win = new Electron.BrowserWindow({
		kiosk: true,
		webPreferences: {
			devTools: true,
			safeDialogs: true
		},
		autoHideMenuBar: true
	});
	win.loadFile("index.html");
	win.setMenu(null);
	return win;
}
Electron.app.whenReady().then(() => {
	this.indexWindow = createWindow();
});
Electron.app.on("window-all-closed", () => {
	if (process.platform != "darwin")
		Electron.app.quit();
});