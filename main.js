const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('node:path');
let petWindow;
let drag = null;

app.whenReady().then(() => {
  petWindow = new BrowserWindow({
    width: 300, height: 300,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, resizable: false, maximizable: false,
    fullscreenable: false, hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  petWindow.setMenu(null);
  petWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  petWindow.webContents.on('will-navigate', event => event.preventDefault());
  petWindow.loadFile('index.html');
  petWindow.on('closed', () => { petWindow = null; drag = null; });
});

function fromPet(event) {
  return petWindow && event.sender === petWindow.webContents;
}
ipcMain.on('pet:drag-start', event => {
  if (!fromPet(event)) return;
  const [x, y] = petWindow.getPosition();
  drag = { x, y, cursor: screen.getCursorScreenPoint() };
});
ipcMain.on('pet:drag-move', event => {
  if (!fromPet(event) || !drag) return;
  const cursor = screen.getCursorScreenPoint();
  petWindow.setPosition(drag.x + cursor.x - drag.cursor.x,
    drag.y + cursor.y - drag.cursor.y);
});
ipcMain.on('pet:drag-end', event => {
  if (fromPet(event)) drag = null;
});
ipcMain.on('pet:menu', event => {
  if (!fromPet(event)) return;
  drag = null;
  Menu.buildFromTemplate([{ label: '退出', click: () => app.quit() }])
    .popup({ window: petWindow });
});
app.on('window-all-closed', () => app.quit());
