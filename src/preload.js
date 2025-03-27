const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveCookies: (profileId, cookies) => ipcRenderer.invoke('save-cookies', profileId, cookies),
    getCookies: (profileId) => ipcRenderer.invoke('get-cookies', profileId),

    // 窗口控制功能
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),

    // 夜间模式设置相关API
    saveNightModeState: (enabled) => ipcRenderer.invoke('save-night-mode', enabled),
    getNightModeState: () => ipcRenderer.invoke('get-night-mode'),
    saveNightModeSettings: (settings) => ipcRenderer.invoke('save-night-mode-settings', settings),
    getNightModeSettings: () => ipcRenderer.invoke('get-night-mode-settings'),

    // 网站级别夜间模式设置
    saveSiteNightMode: (profileId, enabled) => ipcRenderer.invoke('save-site-night-mode', profileId, enabled),
    getSiteNightMode: (profileId) => ipcRenderer.invoke('get-site-night-mode', profileId),
    getAllSiteNightModes: () => ipcRenderer.invoke('get-all-site-night-modes')
});