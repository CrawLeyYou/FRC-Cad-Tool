const axios = require('axios');
const { xml2json } = require('xml-js')
const database = require('./database.js')

const fetchAndymark = async (marker = "") => await axios.get(`https://s3.amazonaws.com/andymark-files?delimiter=/&prefix=STEP%20Files/&marker=${marker}`).then(response => JSON.parse(xml2json(response.data)))

const AndyMark = async () => {
    var andymarkArr = []
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
        if (element.split("STEP Files/")[1] !== "")
            if (element.split("STEP Files/")[1].includes("'"))  {
                database.addFile("Fetched", element.split("STEP Files/")[1].replace("'", "''"), `https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`.replace("'", "''"), "NULL", Date.now(), "NULL", "AndyMark", element.split("STEP Files/")[1].replace("'", "''"), "NULL", "NULL")
            }
            else {
                database.addFile("Fetched", element.split("STEP Files/")[1], `https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`, "NULL", Date.now(), "NULL", "AndyMark", element.split("STEP Files/")[1], "NULL", "NULL")
            }
    })
    return true
}

module.exports = { AndyMark }