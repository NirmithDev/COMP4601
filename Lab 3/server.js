const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");
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
    res.status(200).render('home');
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
    //console.log('Documents in the collection:', documents);
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

// Call the main function to start the connection
main();


app.listen(3000)
console.log("listening on port 3000")