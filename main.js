const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // Re-create window on macOS when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// File save IPC handler
ipcMain.handle('save-file', async (event, { filePath, content }) => {
    try {
        console.log(`Saving file to: ${filePath}`);
        // Check file directory
        const fileDir = path.dirname(filePath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }

        // Save file
        fs.writeFileSync(filePath, content);
        return { success: true };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: error.message };
    }
});

// Open file dialog
ipcMain.handle('show-open-dialog', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            try {
                console.log(`Opening file: ${result.filePaths[0]}`);
                const content = fs.readFileSync(result.filePaths[0], 'utf8');
                return { success: true, filePath: result.filePaths[0], content };
            } catch (error) {
                console.error('Error reading file:', error);
                return { success: false, error: error.message };
            }
        }

        return { success: false, canceled: true };
    } catch (error) {
        console.error('Error in show-open-dialog:', error);
        return { success: false, error: error.message };
    }
});

// Read file IPC handler
ipcMain.handle('read-file', async (event, { filePath }) => {
    try {
        console.log(`Reading file: ${filePath}`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content };
        } else {
            return { success: false, error: 'File does not exist' };
        }
    } catch (error) {
        console.error('Error reading file:', error);
        return { success: false, error: error.message };
    }
});