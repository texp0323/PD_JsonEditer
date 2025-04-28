const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Make sure assets directory exists
function ensureAssetsDirectory() {
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir);
        console.log('Created assets directory');
    }
}

// Saving units to file
function saveUnits(unitsData) {
    ensureAssetsDirectory();
    const data = JSON.stringify(unitsData, null, 2);
    fs.writeFileSync(path.join(__dirname, 'assets/units.json'), data, 'utf-8');
    console.log("Units saved successfully!");
}

// IPC handlers
ipcMain.handle('load-default-template', async () => {
    try {
        const templatePath = path.join(__dirname, 'assets/template.json');
        if (!fs.existsSync(templatePath)) {
            console.warn('Template file not found!');
            return {};
        }
        const data = fs.readFileSync(templatePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load template:', error);
        return {};
    }
});

ipcMain.handle('load-units', async () => {
    try {
        const unitsPath = path.join(__dirname, 'assets/units.json');
        if (!fs.existsSync(unitsPath)) {
            console.warn('Units file not found, creating empty array');
            return [];
        }
        const data = fs.readFileSync(unitsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load units:', error);
        return [];
    }
});

ipcMain.handle('save-units', async (event, unitsData) => {
    try {
        saveUnits(unitsData);
        return { success: true };
    } catch (error) {
        console.error('Failed to save units:', error);
        return { success: false, error: error.message };
    }
});

// Create assets directory when app starts
ensureAssetsDirectory();