const axios = require('axios');
const { xml2json } = require('xml-js')
const database = require('./database.js')
const { JSDOM } = require('jsdom')

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
            if (element.split("STEP Files/")[1].includes("'")) {
                database.addFile("Fetched", element.split("STEP Files/")[1].replace("'", "''"), `https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`.replace("'", "''"), "NULL", Date.now(), "NULL", "AndyMark", element.split("STEP Files/")[1].replace("'", "''"), "NULL", "NULL")
            }
            else {
                database.addFile("Fetched", element.split("STEP Files/")[1], `https://s3.amazonaws.com/andymark-files/${encodeURIComponent(element)}`, "NULL", Date.now(), "NULL", "AndyMark", element.split("STEP Files/")[1], "NULL", "NULL")
            }
    })
    return true
}

const WCP = async () => {
    // Good ol' web scraping. // This is a bit of a mess, but it works. 
    var links = []
    const dom = (await JSDOM.fromURL("https://wcproducts.com/collections/viewall")).window.document
    dom.getElementById("shopify-section-template--16753656627412__main").querySelector("div.container-indent").querySelector("div.container").querySelector("div.row").querySelector("div.col-md-12").querySelector("div.content-indent").querySelector("div.tt-product-listing").querySelectorAll("div.col-6").forEach(element => {
        links.push(element.querySelector("div.product-parent").querySelector("div.tt-description").querySelector("h2.tt-title").querySelector("a").href)
    })
    links.forEach(async (link) => {
        const internalDom = (await JSDOM.fromURL(link)).window.document
        if (internalDom.getElementById("tt-tab-03")?.innerHTML !== undefined) {
            if (internalDom.getElementById("tt-tab-03").querySelector("table.cadtable") !== null) {
                internalDom.getElementById("tt-tab-03").querySelector("table.cadtable").querySelector("tbody").querySelectorAll("tr").forEach(element => {
                    element.querySelectorAll("td").forEach(async (elements) => {
                        (elements?.querySelector("a")?.href !== undefined && elements?.querySelector("a")?.href.includes("https://wcproducts.info/files/frc/cad")) ? (async () => {
                            await database.addFile("Fetched", element?.querySelector("a").href.split("https://wcproducts.info/files/frc/cad/")[1], element?.querySelector("a").href, "NULL", Date.now(), "NULL", "WCP", element?.querySelector("a").href.split("https://wcproducts.info/files/frc/cad/")[1], "NULL", "NULL")
                        })() : null
                    })
                })
            } else {
                internalDom.getElementById("tt-tab-03").querySelector("table.cc").querySelector("tbody").querySelectorAll("tr").forEach(element => {
                    element.querySelectorAll("td").forEach(async (elements) => {
                        (elements?.querySelector("a")?.href !== undefined && elements?.querySelector("a")?.href.includes("https://wcproducts.info/files/frc/cad")) ? (async () => {
                            await database.addFile("Fetched", element?.querySelector("a").href.split("https://wcproducts.info/files/frc/cad/")[1], element?.querySelector("a").href, "NULL", Date.now(), "NULL", "WCP", element?.querySelector("a").href.split("https://wcproducts.info/files/frc/cad/")[1], "NULL", "NULL")
                        })() : null
                    })
                })
            }
        }
    })
    return true
}

const REV = async () => {
    var links = []
    let nextIs = true
    var link = "https://www.revrobotics.com/ion-system/?limit=1000&page="
    let i = 1
    while (nextIs) {
        const dom = (await JSDOM.fromURL(link + i)).window.document
        dom.querySelectorAll("li.productCard--grid").forEach((element) => {
            links.push(element.querySelector("h4.card-title > a").href)
        })
        if (dom.querySelector("li.pagination-item--next") !== null) {
            i++
        } else {
            nextIs = false
        }
    }
    links.forEach(async (link) => {
        const dom = (await JSDOM.fromURL(link)).window.document
        switch (dom.getElementById("SKU-STP")?.innerHTML.toLowerCase()) {
            case "sku-stp":
                await database.addFile("Fetched", dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML, `https://www.revrobotics.com/content/cad/${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`, "NULL", Date.now(), "NULL", "REV", `${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`, "NULL", "NULL")
                // DEBUG //console.log(dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML + " There is a STP file. ", `https://www.revrobotics.com/content/cad/${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`)
                break;
            case "coming soon":
                await database.addFile("Fetched", dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML, `https://www.revrobotics.com/content/cad/${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`, "NULL", Date.now(), "NULL", "REV", `${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`, "NULL", "NULL")
                // DEBUG //console.log(dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML + " There is a STP file but says coming soon? ", `https://www.revrobotics.com/content/cad/${dom.querySelector("dd.productView-info-value.productView-info-value--sku").innerHTML}.STEP`)
                break
            default:
                dom.getElementById("productDescription").querySelectorAll("div > table > tbody > tr > td")?.forEach((parent) => {
                    parent.querySelectorAll("a").forEach(async element => {
                        if (element?.href.includes("/content/cad/")) {
                            await database.addFile("Fetched", element?.href?.split("/content/cad/")[1].split(".STEP")[0], element?.href, "NULL", Date.now(), "NULL", "REV", element?.href?.split("/content/cad/")[1], "NULL", "NULL")
                           // DEBUG // console.log(element?.href?.split("/content/cad/")[1].split(".STEP")[0] + " CHECK1 There is a STP file. ", element?.href)
                        }
                    })
                    parent.querySelectorAll("input").forEach(async element => {
                        if (element?.getAttributeNode("onclick")?.value.includes("/content/cad/")) {
                            await database.addFile("Fetched", element?.getAttributeNode("onclick")?.value.split("'")[1].split("/content/cad/")[1].split(".STEP")[0], element?.getAttributeNode("onclick")?.value.split("'")[1], "NULL", Date.now(), "NULL", "REV", element?.getAttributeNode("onclick")?.value.split("'")[1].split("/content/cad/")[1], "NULL", "NULL")
                            // DEBUG // console.log(element?.getAttributeNode("onclick")?.value.split("'")[1].split("/content/cad/")[1].split(".STEP")[0] + " CHECK2 There is a STP file.", element?.getAttributeNode("onclick")?.value.split("'")[1])
                        }
                    })
                })
                // DEBUG // console.log(decodeURIComponent((element?.href?.includes(".zip")) ? element?.href?.split("/content/cad/")[1].split(".zip")[0] : element?.href?.split("/content/cad/")[1].split(".ST")[0]) + " CHECK There is a STP file. ", element?.href)
                dom.getElementById("productDescription").querySelectorAll("div > ul")?.forEach((parent) => {
                    parent.querySelectorAll("li > a").forEach(async element => {
                        if (element?.href?.includes("/content/cad/")) {
                            await database.addFile("Fetched", decodeURIComponent((element?.href?.includes(".zip")) ? element?.href?.split("/content/cad/")[1].split(".zip")[0] : element?.href?.split("/content/cad/")[1].split(".ST")[0]), element?.href, "NULL", Date.now(), "NULL", "REV", element?.href?.split("/content/cad/")[1], "NULL", "NULL")
                        }
                    })
                    parent.querySelectorAll("li > span > a").forEach(async element => {
                        if (element?.href?.includes("/content/cad/")) {
                            await database.addFile("Fetched", decodeURIComponent((element?.href?.includes(".zip")) ? element?.href?.split("/content/cad/")[1].split(".zip")[0] : element?.href?.split("/content/cad/")[1].split(".ST")[0]), element?.href, "NULL", Date.now(), "NULL", "REV", element?.href?.split("/content/cad/")[1], "NULL", "NULL")
                        }
                    })
                    parent.querySelectorAll("li > ul > li > a").forEach(async element => {
                        if (element?.href?.includes("/content/cad/")) {
                            await database.addFile("Fetched", decodeURIComponent((element?.href?.includes(".zip")) ? element?.href?.split("/content/cad/")[1].split(".zip")[0] : element?.href?.split("/content/cad/")[1].split(".ST")[0]), element?.href, "NULL", Date.now(), "NULL", "REV", element?.href?.split("/content/cad/")[1], "NULL", "NULL")
                        }
                    })
                    parent.querySelectorAll("ul > li > a").forEach(async element => {
                        if (element?.href?.includes("/content/cad/")) {
                            await database.addFile("Fetched", decodeURIComponent((element?.href?.includes(".zip")) ? element?.href?.split("/content/cad/")[1].split(".zip")[0] : element?.href?.split("/content/cad/")[1].split(".ST")[0]), element?.href, "NULL", Date.now(), "NULL", "REV", element?.href?.split("/content/cad/")[1], "NULL", "NULL")
                        }
                    })
                })
        }
    })
}

// Implement all scraping methods in processes folder to here (just to add information to the database) implement download calls in another file

module.exports = { AndyMark, WCP, REV }