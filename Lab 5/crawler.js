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

function computeEuclideanDistance(oldRanks, newRanks) {
    let sum = 0;
    for (let i = 0; i < oldRanks.length; i++) {
        sum += Math.pow(newRanks[i] - oldRanks[i], 2);
    }
    return Math.sqrt(sum);
}

//this will be the async function that will be responsible for calculating and implementing the pageRank functionality
async function addNEWField() {
    const ALPHA = 0.1;
    const N = tempCollection.length;
  
    for (const pageData of tempCollection) {
      pageData.pagerank = 1 / N;
      pageData.adjacencyMatrix = new Array(N).fill(0);
    }
  
    // Create an adjacency matrix
    for (let i = 0; i < N; i++) {
      const pageData = tempCollection[i];
      for (let j = 0; j < N; j++) {
        if (i !== j && pageData.linksText.includes(tempCollection[j].url)) {
          pageData.adjacencyMatrix[j] = 1;
        } else {
          pageData.adjacencyMatrix[j] = 0;
        }
      }
    }
  
    const dampingFactor = 1 - ALPHA;
    const convergenceThreshold = 0.0001;
    const maxIterations = 1000;
  
    let iteration = 0;
    let isConverged = false;
    let prevPageRanks = new Array(N).fill(1 / N);
  
    while (iteration < maxIterations && !isConverged) {
      let newPageRanks = new Array(N).fill(0);
      let allConverged = true;
  
      for (let i = 0; i < N; i++) {
        let sum = 0;
  
        for (let j = 0; j < N; j++) {
          if (i !== j && tempCollection[j].adjacencyMatrix[i] === 1) {
            sum += prevPageRanks[j] / countOutgoingLinks(j);
          }
        }
  
        newPageRanks[i] = (1 - dampingFactor) / N + dampingFactor * sum;
  
        // Check for convergence
        if (Math.abs(newPageRanks[i] - prevPageRanks[i]) > convergenceThreshold) {
          allConverged = false;
        }
      }
      
    if (computeEuclideanDistance(prevPageRanks, newPageRanks) < convergenceThreshold) {
        isConverged = true;
    }
  
    // Update PageRank values for the next iteration
    prevPageRanks = [...newPageRanks];
    for (let i = 0; i < N; i++) {
        tempCollection[i].pagerank = newPageRanks[i];
    }
    iteration++;
    }
}
  
function countOutgoingLinks(index) {
    return tempCollection[index].adjacencyMatrix.reduce((count, value) => count + value, 0);
}



crawler.on('drain', async function () {
    try {
        console.log(`Crawling is complete. Total pages crawled: ${pageCount}`);
        for (let i = 0; i < tempCollection.length; i++) {
            for (let j = 0; j < tempCollection.length; j++) {
                if (i !== j && tempCollection[j].linksText.includes(tempCollection[i].url)) {
                    tempCollection[i].incomingLinks.push(tempCollection[j].url);
                }
            }
            tempCollection[i].size = tempCollection[i].incomingLinks.length; // Update the size (incoming links count)
        }
        await addNEWField();
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
