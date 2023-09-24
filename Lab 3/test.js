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
                $("a").each(function (i, link) {
                    linksText.push($(link).text());
                });
                // Extract and process data here

                // Output the extracted content
                console.log("URL: " + res.request.uri.href);
                const pageData = {
                    url: res.request.uri.href,
                    title: title,
                    keywords: $("meta[name=Keywords]").attr("content"),
                    description: $("meta[name=Description]").attr("content"),
                    paragraphs: $("p").text(),
                    linksText: linksText,
                };
                tempCollection.push(pageData);
                //create a json formatter here

                /*console.log("Keywords: " + $("meta[name=Keywords]").attr("content"));
                console.log("\n\n");
                console.log("Description: " + $("meta[name=Description]").attr("content"));
                console.log("\n\n");
                console.log("Title: " + $("title").text());
                console.log("\n\n");
                //console.log("Body: " + $("body").text());
                console.log("Paragraphs: " + $("p").text());
                console.log("Link and Paragraph Text: " + $("a").text());  
                console.log("--------------------------------------------------");*/
                pageCount++;
                //console.log(pageCount)

                const links = $("a");
                links.each(function (i, link) {
                    const href = $(link).attr("href");
                    if (href) {
                        const absoluteUrl = url.resolve(res.request.uri.href, href);
                        crawler.queue(absoluteUrl);
                    }
                });
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
        // Insert data into MongoDB after crawling is complete
        //await insertDataToMongoDB();
        console.log(`Crawling is complete. Total pages crawled: ${pageCount}`);
        //call db and populate it
        await insertDataDB();
        //console.log(tempCollection.length)
        //console.log(tempCollection)
    } catch (err) {
        console.error("Error during data insertion:", err);
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
});

async function insertDataDB() {
    try {
        // Connect to the database
        await client.connect();

        // Select the database
        const db = client.db(dbName);
        await db.dropDatabase();
        console.log("Dropped 'fruitDB' database.");
        // Select the collection where you want to insert data
        const collection = db.collection("fruitsData");

        // Insert the data from tempCollection into MongoDB
        const result = await collection.insertMany(tempCollection);

        console.log(`Inserted ${result.insertedCount} documents into the database.`);
    } catch (err) {
        console.error("Error inserting data into MongoDB:", err);
    }
}

// Start crawling from the seed URL
crawler.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');
