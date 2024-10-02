import path from "node:path"
import electron from "./lib/electron.js"
import express from "express"
import scrapeLib from "./lib/scraping.js"
import next from "next"
import { WebSocketServer } from "ws"
import { db, getComponents } from "./lib/database.js"
import customEvents from "./lib/customEvents.js"
import RPC from "./lib/rpc.mjs"

new RPC((process.argv[2] === "dev") ? "Dev" : "Production")

let defaultConfig = {
    sql: "name TEXT PRIMARY KEY,url TEXT,md5 TEXT,timestamp INTEGER,successful BOOLEAN,seller TEXT,filename TEXT,size INTEGER,status TEXT,filepath TEXT",
    statusSQL: "id TEXT PRIMARY KEY, status BOOLEAN",
    columnData: new Map()
}

defaultConfig.sql.replace("name TEXT PRIMARY KEY", "name TEXT").split(",").forEach((data) => {
    defaultConfig.columnData.set(data.split(" ")[0], data.split(" ")[1])
})
defaultConfig["length"] = defaultConfig.columnData.size

let activeProcesses = []
var defaultPath = path.join(process.cwd());
const app = express()
const nextApp = next({ dev: (process.argv[2] === "dev") ? true : false })
const getHandler = nextApp.getRequestHandler()

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

const createStatus = async () => {
    db.get(`CREATE TABLE IF NOT EXISTS status(${defaultConfig.statusSQL})`, () => {
        scrapeLib.availableScrapingMethods.forEach(async (data) => {
            db.run(`INSERT OR IGNORE INTO status (id, status) VALUES ('${data.id}', FALSE)`)
        })
    })
}

nextApp.prepare().then(async () => {
    app.listen(9409, async () => {
        console.log("HTTP Listening on port 9409")
        wss.on("listening", async () => {
            console.log("WebSocket Listening on port 9410")
            electron.app.whenReady().then(electron.createWindow).catch((err) => {
                electron.createCriticalError("An error occurred while creating the window.", err.message)
            })
            await databaseRunCheck()
            await createStatus()
        })
    })

    const wss = new WebSocketServer({ port: 9410 })
    let client

    wss.on('connection', (wsc) => {
        client = wsc
        wsc.on('message', (msg) => {
            var message = (JSON.parse(msg.toString()))
            switch (message.type) {
                case "fetch":
                    db.get(`SELECT * FROM status WHERE id = '${message.selection}'`, async (err, data) => {
                        if (data.status === 0) {
                            scrapeLib.availableScrapingMethods.map((methods) => {
                                if (methods.id === message.selection) {
                                    methods.func()
                                }
                            })
                        }
                        else if (data.status === 1) {
                            client.send(JSON.stringify({ type: "redirect" }))
                        }
                        else {
                            electron.createCriticalError("Fetch error", "Unknown error happened please restart the application. If the problem persists, please contact the developer.")
                        }
                    })
                default:
                    break;
            }
        })
    })

    customEvents.scrapeEvent.on("scrape", (data) => {
        client.send(data)
    })

    app.get("/", (req, res) => {
        return nextApp.render(req, res, "/")
    })

    app.get("/download", (req, res) => {
        var downloadSpecification = req.body.specs
    })

    app.get("/options", (req, res) => {
        res.status(200).json({ options: scrapeLib.availableScrapingMethods })
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
        res.jsonp((await getComponents("AndyMark")).map((data) => { data.name = data.name.match(/^[^.]*/g)[0]; return data }))
    })

    app.get('*', (req, res) => {
        return getHandler(req, res)
    })

}).catch((err) => {
    electron.createCriticalError("An error occurred while starting the server.", err.message)
})