const axios = require('axios');
const { xml2json } = require('xml-js')
const download = require('download')

let errorLinks = [] // I'll use this later.
var andymarkArr = []

const fetchAndymark = async (marker = "") => await axios.get(`https://s3.amazonaws.com/andymark-files?delimiter=/&prefix=STEP%20Files/&marker=${marker}`).then(response => JSON.parse(xml2json(response.data)))

const Main = async () => {
    var thereAreFiles = true
    var nextMarker = ""
    while (thereAreFiles) {
        thereAreFiles = false
        var data = await fetchAndymark(nextMarker)
        data.elements[0].elements.forEach(element => {
            if (element.name === "Contents") {
                andymarkArr.push(element.elements[0].elements[0].text)
            }
            else if (element.name === "NextMarker") {
                nextMarker = element.elements[0].text
                thereAreFiles = true
            }
        })
    }
    andymarkArr.forEach(async (element, i) => {
        download(`https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`, "cadFiles/AndyMark", { filename: element.split("STEP Files/")[1] }).then(() => {
            process.send(`Downloaded ${element}`)
        }).catch((err) => {
            process.send("An error occurred while downloading the file, please try again. " + element)
            errorLinks.push(`https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`)
        })
    })
}

Main()