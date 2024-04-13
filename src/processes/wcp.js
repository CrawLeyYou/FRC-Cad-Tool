const download = require('download')
const { JSDOM } = require('jsdom')

let errorLinks = [] // I'll use this later.

async function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

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
                            await download(element?.querySelector("a").href, "cadFiles/WCP", { filename: decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1] }).then(async () => {
                                process.send(`Downloaded ${decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1]}`)
                            }).catch(async (err) => {
                                process.send("An error occurred while downloading the file, please try again. " + element?.querySelector("a").href)
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
                            await download(element?.querySelector("a").href, "cadFiles/WCP", { filename: decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1] }).then(async () => {
                                process.send(`Downloaded ${decodeURI(element?.querySelector("a").href).split("https://wcproducts.info/files/frc/cad/")[1]}`)
                            }).catch(async (err) => {
                                process.send("An error occurred while downloading the file, please try again. " + element?.querySelector("a").href)
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


downloadWCP()

