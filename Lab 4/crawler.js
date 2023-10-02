const Crawler = require("crawler");
const url = require("url");
const { MongoClient } = require('mongodb');

const dbName = "fruitDB";
const dbUrl = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";

const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

let visitedUrls = new Set();
let visitedTitles = new Set();
let pageCount = 0;

let tempCollection =[]

const crawler = new Crawler({
    maxConnections: 10,
    callback: async function (error, res, done) {
        try {
            if (error) {
                console.error(error);
                return;
            }

            const $ = res.$;
            const title = $("title").text().trim();

            if (!visitedUrls.has(res.request.uri.href) || !visitedTitles.has(title)) {
                visitedUrls.add(res.request.uri.href);
                visitedTitles.add(title);
                const linksText = [];
                const incomingLinks = []; // Initialize for incoming links

                $("a").each(function (i, link) {
                    const href = $(link).attr("href");
                    if (href) {
                        const absoluteUrl = url.resolve(res.request.uri.href, href);
                        crawler.queue(absoluteUrl);

                        // Record the URL of the current page as an outgoing link
                        linksText.push(absoluteUrl);

                        // Record the URL of the current page as an incoming link for the linked page
                        incomingLinks.push(absoluteUrl);
                    }
                });
                // Output the extracted content
                console.log("URL: " + res.request.uri.href);
                const pageData = {
                    url: res.request.uri.href,
                    title: title,
                    keywords: $("meta[name=Keywords]").attr("content"),
                    description: $("meta[name=Description]").attr("content"),
                    paragraphs: $("p").text(),
                    linksText: linksText,
                    incomingLinks: incomingLinks,
                    size:incomingLinks.length // Store incoming links
                };
                tempCollection.push(pageData);

                pageCount++;
            }
        } catch (err) {
            console.error("Error during crawling:", err);
        } finally {
            done();
        }
    },
});

crawler.on('drain', async function () {
    try {
        console.log(`Crawling is complete. Total pages crawled: ${pageCount}`);
        await insertDataDB();
    } catch (err) {
        console.error("Error during data insertion:", err);
    } finally {
        await client.close();
    }
});

async function insertDataDB() {
    try {
        await client.connect();
        const db = client.db(dbName);
        await db.dropDatabase();
        console.log("Dropped 'fruitDB' database.");
        const collection = db.collection("fruitsData");
        const result = await collection.insertMany(tempCollection);

        console.log(`Inserted ${result.insertedCount} documents into the database.`);
    } catch (err) {
        console.error("Error inserting data into MongoDB:", err);
    }
}

crawler.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');
