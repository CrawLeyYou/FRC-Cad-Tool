const download = require('download')

download("https://github.com/CrossTheRoadElec/Device-CADs/archive/refs/heads/master.zip", "cadFiles/CTRE", { filename: "CTRE.zip", extract: true }).then(() => {
    process
    .send("Downloaded CTRE and Extracted")
    .exit(0)
}).catch((err) => {
    process
    .send("An error occurred while downloading the CTRE file, please try again. ")
    .exit(1)
})
