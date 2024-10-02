const sqlite3 = require('sqlite3')

var db = sqlite3.cached.Database(process.cwd() + '/localdb.db')

const addFile = async (status, name, url, md5, timestamp, successful, seller, filename, size, path) => {
    db.run(`INSERT OR IGNORE INTO cadFiles (status, name, url, md5, timestamp, successful, seller, filename, size, filepath) VALUES ('${status}', "${name}", "${url}", '${md5}', ${timestamp}, ${successful}, '${seller}', "${filename}", ${size}, "${path}");`)
}

const getComponents = async (seller) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM cadFiles WHERE seller = '${seller}';`, (err, data) => resolve(data))
})

const updateStatus = async (id) => {
    db.run(`UPDATE status SET status = TRUE WHERE id = '${id}';`)
}

module.exports = {
    addFile,
    updateStatus,
    getComponents,
    db
}