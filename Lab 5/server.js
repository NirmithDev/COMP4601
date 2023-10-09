const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");
var elasticlunr = require('elasticlunr');
const { MongoClient, ObjectId } = require("mongodb");
app.use('/css',express.static(__dirname+'/style'))
let db;
let dv;
let local;
//middleware
app.use(express.urlencoded({ extended: true }));

app.set('views', './pages');
app.set('view engine', 'pug');

app.get('/', (req,res)=>{
    res.status(200).render('home',{error:"Search Something"});
})
app.get('/popular',(req,res)=>{
    //find top 10 websites based on number of values in linksText or incomingLinks
    const top10Websites = local.filter(doc => doc.linksText && doc.linksText.length > 0).sort((a, b) => b.linksText.length - a.linksText.length).slice(0, 10);
    //console.log(top10Websites)
    res.status(200).render('popular',{siteData:top10Websites});
})

//handle user asking for a specific site data 
app.get('/visit/:rid',(req,res)=>{
    //const requestedSiteTitle = req.params.rid;
    const pageData = local.find(item => item.title.toString() === req.params.rid);

    if (pageData) {
        const strippedIncomingLinks = pageData.incomingLinks.map(url => {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.split('.')[0];
        });
        const strippedLinksText = pageData.linksText.map(url => {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.split('.')[0];
        });

        // Pass the stripped data to the template
        res.status(200).render('pageData', { data: pageData, strippedIncomingLinks });
    } else {
        res.status(404).send('Site not found in crawled DB');
    }
})
//lab 4

const index = elasticlunr(function () {
  this.addField('title');
  this.addField('paragraphs');
  this.addField('id');
  this.setRef('id');
});

app.get('/searchPages', async (req,res)=>{
  console.log(req.query)
  const results = index.search(req.query.query).slice(0,10);
  //console.log(results)
  //get those data from local based of the name
  const collection = db.collection(collectionName);
  const topData = [];

  for (const data of results) {
    //console.log(data.ref);
    try {
      const getData = await collection.findOne({ _id: new ObjectId(data.ref) });
      if (getData) {
        getData.score = data.score.toFixed(2)
        topData.push(getData);
      }
    } catch (err) {
      console.error(`Error fetching data for ID ${data.ref}: ${err.message}`);
    }
  }
  //console.log(topData)
  //make them clickable and link to a new page
  res.status(200).render('home',{topdawg:topData});
})

app.get("/pageRank",(req,res)=>{
  //console.log(local)
  sortedLocal = local;
  sortedLocal.sort((a, b) => b.pagerank - a.pagerank);

// Get the top 25 items
  const top25 = sortedLocal.slice(0, 25);
  let pages = top25.map((page) => ({
    title: page.title,
    link: page.url,
    rank: page.pagerank,
  }))
  //console.log(top25)
  res.status(200).json(pages)
})

const url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";
const dbName = "fruitDB";

const collectionName = 'fruitsData';
// Create a MongoClient instance
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to database.");

    // Access the database
    db = client.db(dbName);
    const collection = db.collection(collectionName);

    local = await collection.find({}).toArray();
    local.forEach((pageData)=>{
      //console.log(pageData)
      const doc = {
        id: pageData._id.toString(), // Ensure id is a string
        url: pageData.url || '', // Handle undefined or null fields by providing default values
        title: pageData.title || '',
        keywords: pageData.keywords || '', // Handle null values
        description: pageData.description || '', // Handle null values
        paragraphs: pageData.paragraphs || '', // Handle null values
        linksText: Array.isArray(pageData.linksText) ? pageData.linksText : [], // Ensure linksText is an array
        incomingLinks: Array.isArray(pageData.incomingLinks) ? pageData.incomingLinks : [], // Ensure incomingLinks is an array
        size: pageData.size || 0 // Handle null or undefined values, and convert to a numeric value if needed
      };
      index.addDoc(doc);
    })
    //console.log(index)
    //console.log('Documents in the collection:', documents);
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

// Call the main function to start the connection
main();


app.listen(3000)
console.log("listening on port 3000")