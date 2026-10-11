// VET Office desktop (Mac .dmg en Windows .exe)
// De app opent de webversie (altijd de nieuwste versie); dankzij de service worker werkt ze ook offline.
const { app, BrowserWindow, shell, Menu } = require('electron');
const URL_APP = 'https://38blanc.github.io/vet-office/index.html';
const EXTERN = /^(mailto:|tel:|sms:)/i;

function maakVenster() {
  const win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 380, minHeight: 500, title: 'VET Office', backgroundColor: '#eceff2', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true }
  });
  win.loadURL(URL_APP).catch(() => win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<body style="font-family:system-ui;padding:40px"><h2>VET Office</h2><p>Geen internet bij de eerste start. Verbind met internet en open de app opnieuw – daarna werkt ze ook offline.</p></body>')));
  // mail, telefoon en externe websites in het standaardprogramma openen
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERN.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
    if (url.startsWith('https://38blanc.github.io/') || url.startsWith('blob:') || url.startsWith('data:') || url === 'about:blank') return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } };
    shell.openExternal(url); return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (EXTERN.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  return win;
}

const sjabloon = [
  ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
  { label: 'Bewerken', submenu: [{ role: 'undo', label: 'Ongedaan maken' }, { role: 'redo', label: 'Opnieuw' }, { type: 'separator' }, { role: 'cut', label: 'Knippen' }, { role: 'copy', label: 'Kopiëren' }, { role: 'paste', label: 'Plakken' }, { role: 'selectAll', label: 'Alles selecteren' }] },
  { label: 'Weergave', submenu: [{ role: 'reload', label: 'Vernieuwen' }, { role: 'zoomIn', label: 'Groter' }, { role: 'zoomOut', label: 'Kleiner' }, { role: 'resetZoom', label: 'Normale grootte' }, { role: 'togglefullscreen', label: 'Volledig scherm' }] },
  { role: 'windowMenu', label: 'Venster' }
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(sjabloon));
  maakVenster();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) maakVenster(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
