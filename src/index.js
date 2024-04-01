const axios = require('axios');
const { xml2json } = require('xml-js')
const download = require('download')
const { JSDOM } = require('jsdom')

let errorLinks = [] // I'll use this later.
var andymarkArr = []

async function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

const fetchAndymark = async (marker = "") => await axios.get(`https://s3.amazonaws.com/andymark-files?delimiter=/&prefix=STEP%20Files/&marker=${marker}`).then(response => JSON.parse(xml2json(response.data)))
const downloadWCP = async () => {
    // Good ol' web scraping.
    var links = []
    const dom = (await JSDOM.fromURL("https://wcproducts.com/collections/viewall")).window.document
    dom.getElementById("shopify-section-template--16753656627412__main").querySelector("div.container-indent").querySelector("div.container").querySelector("div.row").querySelector("div.col-md-12").querySelector("div.content-indent").querySelector("div.tt-product-listing").querySelectorAll("div.col-6").forEach(element => {
        links.push(element.querySelector("div.product-parent").querySelector("div.tt-description").querySelector("h2.tt-title").querySelector("a").href)
    })
    links.forEach(async (link) => {
        const internalDom = (await JSDOM.fromURL(link)).window.document
        await sleep(100);
        if (internalDom.getElementById("tt-tab-03")?.innerHTML !== undefined) {
            if (internalDom.getElementById("tt-tab-03").querySelector("table.cadtable") !== null) {
                internalDom.getElementById("tt-tab-03").querySelector("table.cadtable").querySelector("tbody").querySelectorAll("tr").forEach(element => {
                    element.querySelectorAll("td").forEach(async (elements) => {
                        (elements?.querySelector("a")?.href !== undefined && elements?.querySelector("a")?.href.includes("https://wcproducts.info/files/frc/cad")) ? (async () => {
                            await sleep(100);
                            download(element?.querySelector("a").href, "cadFiles/WCP", { filename: decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1] }).then(async () => {
                                console.log(`Downloaded ${decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1]}`)
                            }).catch(async (err) => {
                                console.log("An error occurred while downloading the file, please try again. " + element?.querySelector("a").href)
                                errorLinks.push(element?.querySelector("a").href)
                                await sleep(100);
                            })
                        })() : null
                    })
                })
            } else {
                internalDom.getElementById("tt-tab-03").querySelector("table.cc").querySelector("tbody").querySelectorAll("tr").forEach(element => {
                    element.querySelectorAll("td").forEach(async (elements) => {
                        (elements?.querySelector("a")?.href !== undefined && elements?.querySelector("a")?.href.includes("https://wcproducts.info/files/frc/cad")) ? (async () => {
                            await sleep(100);
                            download(element?.querySelector("a").href, "cadFiles/WCP", { filename: decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1] }).then(async () => {
                                console.log(`Downloaded ${decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1]}`)
                            }).catch(async (err) => {
                                console.log("An error occurred while downloading the file, please try again. " + element?.querySelector("a").href)
                                errorLinks.push(element?.querySelector("a").href)
                                await sleep(100);
                            })
                        })() : null
                    })
                })
            }
        }
    })
}

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
    andymarkArr.forEach((element) => {
        download(`https://s3.amazonaws.com/andymark-files/${element.replace("+", "%2B").replace("+", "%2B")}`, "cadFiles/AndyMark", { filename: element.split("STEP Files/")[1] }).then(() => {
            console.log(`Downloaded ${element}`)
        })
        //I still don't know why we can't use encodeURI and need to replace + sign twice to make it work but its okay i guess. 
    })
    download("https://github.com/CrossTheRoadElec/Device-CADs/archive/refs/heads/master.zip", "cadFiles/CTRE", { extract: true }).then(() => {
        console.log("Downloaded CTRE and Extracted")
    })
    downloadWCP()
}

Main()