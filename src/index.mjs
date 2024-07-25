import fs from "node:fs"
import cprocess from "node:child_process"
import path from "node:path"
import electron from "./lib/electron.js"
import express from "express"
import sqlite3 from "sqlite3"
import test from "./lib/scraping.js"
import next from "next"

const db = new sqlite3.cached.Database(process.cwd() + '/localdb.db')

let defaultConfig = {
    "sql": "name TEXT PRIMARY KEY,url TEXT,md5 TEXT,timestamp INTEGER,successful BOOLEAN,seller TEXT,filename TEXT,size INTEGER,status TEXT,filepath TEXT",
    columnData: new Map()
}

defaultConfig.sql.replace("name TEXT PRIMARY KEY", "name TEXT").split(",").forEach((data) => {
    defaultConfig.columnData.set(data.split(" ")[0], data.split(" ")[1])
})
defaultConfig["length"] = defaultConfig.columnData.size

let activeProcesses = []
const processes = path.join(process.cwd(), 'processes');
const commandFolders = fs.readdirSync(processes);
var defaultPath = path.join(process.cwd());
const app = express()
const nextApp = next({ dev: (process.argv[2] === "dev") ? true : false })

const fork = (cwd, file) => {
    var process = cprocess.fork(cwd + "/processes/" + file)
    activeProcesses.push({ proc: process, file: file })
    process.on("message", (msg) => {
        console.log(msg)
    })
    process.on("exit", () => {
        activeProcesses = activeProcesses.filter((data) => !(data.proc.pid === process.pid))
    })
}

const install = async (spec) => {
    console.log("Starting...")
    switch (spec) {
        case "all":
            for (const folder of commandFolders) {
                fork(process.cwd(), folder)
            }
            break;
        case "ctre":
            fork(process.cwd(), "ctre.js")
            break;
        case "andymark":
            fork(process.cwd(), "andymark.js")
            break;
        case "wcp":
            fork(process.cwd(), "wcp.js")
            break;
        default:
            return "Invalid Specification."
    }
}

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.disable('x-powered-by');
app.use(express.static(defaultPath + '/public'))

const databaseIntegrityCheck = async () => new Promise(async (resolve, reject) => {
    try {
        await db.all("PRAGMA table_info('cadFiles')", (err, data) => {
            var columns = new Map()
            var missingList = []
            var corruptedList = []
            data.map((data) => columns.set(data.name, data.type))
            defaultConfig.columnData.forEach((value, key) => {
                if (columns.has(key)) {
                    if (columns.get(key) !== value) {
                +        corruptedList.push(key)
                    }
                } else {
                    missingList.push(key)
                }
            })
            missingList.forEach((data) => {
                db.run(`ALTER TABLE cadFiles ADD COLUMN ${data} ${defaultConfig.columnData.get(data)}`)
            })
            corruptedList.forEach(async (data) => {
                db.serialize(() => {
                    db.run(`ALTER TABLE cadFiles DROP COLUMN ${data}`)
                    db.run(`ALTER TABLE cadFiles ADD COLUMN ${data} ${defaultConfig.columnData.get(data)}`)
                })
            })
            resolve({ status: "success", work: (missingList.length > 0 && corruptedList.length > 0) ? "missing and corrupted columns fixed." : ((missingList.length > 0) ? "missing columns added." : ((corruptedList.length > 0) ? "corrupted columns fixed." : "nothing changed")) })
        })
    } catch (err) {
        reject({ status: "error", message: err })
    }
})

const databaseRunCheck = async () => {
    db.get("SELECT COUNT(*) as availableColumns FROM pragma_table_info('cadFiles');", async (err, data) => {
        if (data.availableColumns === defaultConfig["length"]) {
            console.log("It has same amount of columns as it should.")
            await databaseIntegrityCheck().then((res) => {
                console.log("Integrity check has been completed. Check result:", res.work)
            }).catch((err) => {
                electron.createCriticalError("An error occurred on databaseIntegrityCheck()", err.message)
            })
        } else if (data.availableColumns < defaultConfig["length"] && data.availableColumns !== 0) {
            console.log("Database is not up to date.")
            await databaseIntegrityCheck().then((res) => {
                console.log("Integrity check has been completed. Check result:", res.work)
            }).catch((err) => {
                electron.createCriticalError("An error occurred on databaseIntegrityCheck()", err.message)
            })
        }
        else if (data.availableColumns === 0) {
            console.log("There is no table. Creating one...")
            db.run(`CREATE TABLE IF NOT EXISTS cadFiles(${defaultConfig.sql})`)
        }
    })
}

nextApp.prepare().then(() => {

    app.listen(9409, async () => {
        console.log("Listening on port 9409")
        electron.app.whenReady().then(electron.createWindow).catch((err) => {
            electron.createCriticalError("An error occurred while creating the window.", err.message)
        })
        await databaseRunCheck()
    })

    app.get("/", (req, res) => {
        return nextApp.render(req, res, "/")
    })

    app.get("/download", (req, res) => {
        var downloadSpecification = req.body.specs
        install(downloadSpecification.install)
    })

    app.get("/kill", (req, res) => {
        if (req.body.spec.kill === "all" || commandFolders.includes(req.body.spec.kill + ".js")) {
            if (req.body.spec.kill !== "all") {
                activeProcesses.filter((data) => data.file === req.body.spec.kill + ".js")[0].proc.kill()
                activeProcesses = activeProcesses.filter((data) => !(data.file === req.body.spec.kill + ".js"))
            }
            else {
                activeProcesses.forEach((data) => data.proc.kill())
                activeProcesses = []
            }
        }
    })

    app.get("/_next/static/*", (req, res) => {
        res.sendFile(defaultPath + "/.next/static/" + req.url.split("/_next/static/")[1].split("?")[0])
    })

    app.get("/status", (req, res) => {
        console.log(activeProcesses)
    })

    app.get("/test", async (req, res) => {
        test.REV()
        test.WCP()
        test.AndyMark()
    })
}).catch((err) => {
    electron.createCriticalError("An error occurred while starting the server.", err.message)
})