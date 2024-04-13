const fs = require('fs');
const cprocess = require('child_process');
const path = require('path');

const Main = async () => {
    console.log("Starting...")
    const processes = path.join(__dirname, 'processes');
    const commandFolders = fs.readdirSync(processes);
    for (const folder of commandFolders) {
        cprocess.fork(__dirname + "/processes/" + folder)
         .on('message', (message) => {
            console.log(message)
         })
    }
}

Main()