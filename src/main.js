const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

app.commandLine.appendSwitch('disable-site-isolation-trials');

const appDirectory = path.join(__dirname, '../data');

if (!fs.existsSync(appDirectory)) {
    fs.mkdirSync(appDirectory, { recursive: true });
}
app.setPath('userData', appDirectory);

const store = new Store({
    name: 'site-data'
});

// 创建主窗口
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // 移除窗口原生框架
        backgroundColor: '#1e1e1e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        }
    });

    // 监听窗口控制事件
    ipcMain.handle('window-minimize', () => mainWindow.minimize());
    ipcMain.handle('window-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
        return mainWindow.isMaximized();
    });
    ipcMain.handle('window-close', () => mainWindow.close());

    // 刷新webview的方法
    ipcMain.handle('refresh-webview', (event, id) => {
        mainWindow.webContents.send('refresh-webview', id);
        return true;
    });

    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.insertCSS(`
            .tabs {
                -webkit-app-region: drag;
            }
            .tab, .window-controls {
                -webkit-app-region: no-drag;
            }
        `);
    });

    // 加载主界面
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 开发环境打开DevTools
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
};

// 应用程序准备就绪时创建窗口
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 保存Cookie
ipcMain.handle('save-cookies', async (event, profileId, cookies) => {
    store.set(`cookies.${profileId}`, cookies);
    return true;
});

// 获取Cookie
ipcMain.handle('get-cookies', async (event, profileId) => {
    return store.get(`cookies.${profileId}`);
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

ipcMain.handle('save-night-mode', async (event, enabled) => {
    store.set('nightMode', enabled);
    return true;
});

// 获取夜间模式状态
ipcMain.handle('get-night-mode', async () => {
    return store.get('nightMode');
});

ipcMain.handle('save-site-night-mode', async (event, profileId, enabled) => {
    const siteSettings = store.get('siteNightModes') || {};
    siteSettings[profileId] = enabled;
    store.set('siteNightModes', siteSettings);
    return true;
});

// 获取特定网站的夜间模式设置
ipcMain.handle('get-site-night-mode', async (event, profileId) => {
    const siteSettings = store.get('siteNightModes') || {};
    // 如果没有特定设置，返回null表示使用全局设置
    return siteSettings[profileId] !== undefined ? siteSettings[profileId] : null;
});

// 获取所有网站的夜间模式设置
ipcMain.handle('get-all-site-night-modes', async () => {
    return store.get('siteNightModes') || {};
});

// 保存夜间模式设置
ipcMain.handle('save-night-mode-settings', async (event, settings) => {
    store.set('nightModeSettings', settings);
    return true;
});

// 获取夜间模式设置
ipcMain.handle('get-night-mode-settings', async () => {
    return store.get('nightModeSettings') || {
        intensity: 85,
        brightness: 110,
        contrast: 110
    };
});