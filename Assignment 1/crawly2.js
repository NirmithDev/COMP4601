//Required module (install via NPM)
const Crawler = require("crawler");
const url = require("url");
const { MongoClient } = require('mongodb');
const DBname = "pagesDB";
const {Matrix} = require("ml-matrix");
const cheerio = require('cheerio');

//Connection URL
const mongourl = "mongodb+srv://johnwscaife:databasepassword@cluster0.qpyexxh.mongodb.net/?retryWrites=true&w=majority";

//Create a MongoClient instance
const client = new MongoClient(mongourl, { useNewUrlParser: true, useUnifiedTopology: true });

let visitedTitlesPersonal = new Set();
let tempDataPersonal = [];
let visited = new Set();
let n = 0;
//Initialize the database
async function databaseInit() {
  try {
    //Connect to MongoDB server
    await client.connect();
    console.log("Connected to database.");

    //Access the database using client.db(DBname)
    const db = client.db(DBname);

    //Drop the existing database if it exists
    try {
        await db.dropCollection("personalPages");
        console.log("Dropped collection.");
    } catch (err) {
        console.log("Failed to drop collection: " + err.message);
    }

    //Create the 'pages' collection
    const pagesCollection = db.collection("personalPages");
    const result = await pagesCollection.insertMany(tempDataPersonal);
    console.log("Pages added to the database!")

  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}


const crawler = new Crawler({
    maxConnections : 10, //use this for parallel, rateLimit for individual
    rateLimit: 10,

    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(n>=500){
            crawler.queue=[];
            crawler.emit("drain")
            return;
        }
        
        if(error) {
            console.log(error);
        } else {
            const $ = res.$; //get cheerio data, see cheerio docs for info

            const curLink = res.request.uri.href;
            //console.log(curLink)
            const curTitle = $('title').text().trim();
            //console.log(curTitle)

            let curParentLinkArr = res.request.path.split("/").slice(2);
            let curParentLink = "https://en.wikipedia.org/wiki/Main_Page" + "/" + curParentLinkArr.join("/");
            
            if (!visited.has(curParentLink) && !visitedTitlesPersonal.has(curTitle)) {
                visited.add(curParentLink);
                visitedTitlesPersonal.add(curTitle)
                n++;
                // visit everything (bfs)
                console.log(n)
                const summary = $('p').text()
                let connectedPages = [];
                $("a").each(function (i, link) {
                    let curLink = $(link).attr("href");
                    if (!curLink) {
                        return;
                    }
                    if (curLink.startsWith("/wiki/") && !curLink.startsWith("/wiki/File:")) {
                        curLink = "https://en.wikipedia.org/" + curLink;

                        connectedPages.push(curLink); 
                        if (!visited.has(curLink) && n < 500) {
                            crawler.queue(curLink);
                            // n++
                        }
                    }
                });
                curData = {
                    url: curLink,
                    title: curTitle,
                    paragraphs: summary,
                    outgoingLinks: connectedPages
                }
                tempDataPersonal.push(curData);
        }
        }
        done();
    }
});

//Perhaps a useful event
//Triggered when the queue becomes empty
//There are some other events, check crawler docs
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
    const N = tempDataPersonal.length;
  
    for (const pageData of tempDataPersonal) {
      pageData.pr = 1 / N;
      pageData.adjacencyMatrix = new Array(N).fill(0);
    }
  
    // Create an adjacency matrix
    for (let i = 0; i < N; i++) {
      const pageData = tempDataPersonal[i];
      for (let j = 0; j < N; j++) {
        if (i !== j && pageData.outgoingLinks.includes(tempDataPersonal[j].url)) {
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
          if (i !== j && tempDataPersonal[j].adjacencyMatrix[i] === 1) {
            sum += prevPageRanks[j] / countOutgoingLinks(j);
          }
        }
  
        newPageRanks[i] = (1 - dampingFactor) / N + dampingFactor * sum;
  
        // Check for convergence
        if (Math.abs(newPageRanks[i] - prevPageRanks[i]) > convergenceThreshold) {
          allConverged = false;
        }
      }
    //calculate difference
    if (computeEuclideanDistance(prevPageRanks, newPageRanks) < convergenceThreshold) {
        isConverged = true;
    }
  
    // Update PageRank values for the next iteration
    prevPageRanks = [...newPageRanks];
    for (let i = 0; i < N; i++) {
        tempDataPersonal[i].pr = newPageRanks[i];
    }
    iteration++;
    }
}
  
function countOutgoingLinks(index) {
    return tempDataPersonal[index].adjacencyMatrix.reduce((count, value) => count + value, 0);
}

crawler.on('drain', async function(){
    try {
        console.log("Done!");
        console.log(`We have crawled through ${n} pages...`);
    
        console.log
        //before initializing the database we must create an incoming link collection
        //so we iterate over the tempCollection
        for(i=0;i<tempDataPersonal.length;i++){
            //console.log(temp[i].url)
            tempDataPersonal[i].incomingLinks=[]
            for(j=0;j<tempDataPersonal.length;j++){
                if(i==j){
                    continue;
                }
                let a = new Set(tempDataPersonal[j].outgoingLinks)
                if(a.has(tempDataPersonal[i].url)){
                    incoming=true 
                    tempDataPersonal[i].incomingLinks.push(tempDataPersonal[j].url)
                }
                //console.log(temp[j].url)
                //if(temp[i].url = temp[j].outgoingLinks)
            }
        }
        await addNEWField();
        console.log('Initializing Database...');
        await databaseInit();
    } catch (err) {
        console.error("Error furing data insertion: " + err.message);
    } finally {
        await client.close();
    }
});

//Queue a URL, which starts the crawl
//switch to imdb
const seedLinks = [
    'https://en.wikipedia.org/wiki/Main_Page',
    
];
seedLinks.forEach((dataLink)=>{
    crawler.queue(dataLink)
})