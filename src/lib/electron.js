const {
    app,
    BrowserWindow,
    dialog
} = require('electron')

let win
let devmode = (process.argv[2] === "dev") ? true : false

const createWindow = async () => {
    win = new BrowserWindow({
        webPreferences: {
            devTools: devmode
        },
        autoHideMenuBar: !devmode,
        minWidth: 850,
        minHeight: 550,
        height: 550
    })
    win.loadURL('http://localhost:9409')
}

const createCriticalError = async (message, detail) => {
    dialog.showMessageBox(null, {
        type: "error",
        buttons: ["Exit"],
        title: "Error",
        message: message,
        detail: detail,
        defaultId: 0
    }).then(() => {
        process.exit(0)
    })
}

module.exports = {
    app,
    createWindow,
    createCriticalError
}