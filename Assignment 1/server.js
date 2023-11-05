const express = require('express');
const pug = require('pug');
const { MongoClient, ObjectId } = require("mongodb");
const elasticlunr = require("elasticlunr");
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/css', express.static(__dirname + '/styles'));
app.use('/images', express.static(__dirname + '/images'));
app.set('/views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('json spaces', 2)
const port = 3000;

const mongourl = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";
const DBName = "pagesDB";

const personalCollectionName = "personalPages";
const fruitCollectionName = "pages";

const client = new MongoClient(mongourl, { useNewUrlParser: true, useUnifiedTopology: true });

let personalPages = [];
let fruitPages = [];

const personalPagesSearch = elasticlunr(function () {
    this.addField('title');
    this.addField('paragraphs');
    this.addField('pr');
    this.addField('id');
    this.setRef('id');
});

const fruitPagesSearch = elasticlunr(function () {
    this.addField('title');
    this.addField('paragraphs');
    this.addField('pr');
    this.addField('id');
    this.setRef('id');
});

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function appendRandomResults(currentResults, limit, collection) {
    let newResults = new Set(currentResults);
    let collectionCopy = [...collection];
    collectionCopy.sort((a, b) => {
        return a.pr - b.pr;
    });
    while (newResults.size < limit) {
        // let i = getRandomInt(collection.length);
        let temp = collectionCopy.pop(0);
        temp.searchscore = 0.00;
        newResults.add(temp);
    }
    return Array.from(newResults);
}

function getWordCount(inputString) {
    const cleanedString = inputString
        .replace(/[^\w\s]|_/g, ' ') // Remove punctuation and special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .toLowerCase(); // Convert to lowercase

    const words = cleanedString.split(' ');

    let wordCount = {};

    // Iterate through the array of words and update the word counts
    for (let word of words) {
        if (word) { // Ignore empty strings
            if (wordCount[word]) {
                wordCount[word]++;
            } else {
                wordCount[word] = 1;
            }
        }
    }

    return wordCount;
}

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to database.");

        db = client.db(DBName);

        const personalCollection = db.collection(personalCollectionName);
        const fruitCollection = db.collection(fruitCollectionName);

        personalPages = await personalCollection.find({}).toArray();
        fruitPages = await fruitCollection.find({}).toArray();

        personalPages.forEach(function (p) {
            // console.log(p);
            personalPagesSearch.addDoc({
                id: p._id.toString(),
                title: p.title || '',
                paragraphs: p.paragraphs || '',
                pr: p.pr || parseFloat(0)
            });

            p.wordCount = getWordCount(p.paragraphs);
        });
        fruitPages.forEach(function (p) {
            // console.log(p);
            fruitPagesSearch.addDoc({
                id: p._id.toString(),
                title: p.title || '',
                paragraphs: p.paragraphs || '',
                pr: p.pr || parseFloat(0)
            });

            p.wordCount = getWordCount(p.paragraphs);
        });

    } catch (err) {
        console.error("Error connecting to the database:", err);
    }
    console.log("Database information retrieved");
    // Make a PUT request
}

async function searchEngine(){
    await connectToDatabase();
    axios.put('http://134.117.130.17:3000/searchengines', {request_url: 'http://134.117.135.26:3000'}, {'Content-Type': 'application/json'})
    .then((response) => {
        
        console.log('PUT request successful');
        console.log(response.data);
    }).catch((error) => {
        console.error('Error making PUT request:', error);
    });
}
searchEngine()
// Render the home page
app.get('/', function (req, res) {
    res.status(200).render('app', {home: true, fruit_pages: fruitPages, personal_pages: personalPages}); 
});

// Render the search page
app.get('/search', function (req, res) {
    res.status(200).render('app', {search: true}); 
});

// Search results for personal collection
app.get('/personal', function (req, res) {
    let q = req.query.q;
    let boost = req.query.boost||'false';
    let limit = req.query.limit||10;
    if(q==""){
        console.log("EMPTY INPUT NO BUENO")
        res.status(200).render('app', {search: true,error:"NO EMPTY INPUT"});
    }else{
        if (limit > 50 || limit < 1) {
            res.status(400).render('app', {search: true});
        }

        let results = [];
        let page_list = [];

        results = personalPagesSearch.search(q, {expand: true});
        results.forEach((result) => {
            p = personalPages.find(page => page._id.toString() == (result.ref));
            if (boost == 'true') {
                p.searchscore = (result.score * p.pr);
            } else {
                p.searchscore = result.score;
            }
            page_list.push(p);
        });
        if (page_list.length < parseInt(limit)) {
            page_list = appendRandomResults(page_list, parseInt(limit), personalPages);
        }
        page_list.sort((a, b) => {
            return b.searchscore - a.searchscore;
        });

        if(!page_list){
            res.status(404).send("personal ID not found in store")
        }
        else if(page_list){
            res.format({
                'text/plain': function () {
                    res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'personal'});
                },
            
                'text/html': function () {
                    res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'personal'});
                },
            
                'application/json': function () {
                    let sliceData=page_list.slice(0,parseInt(limit));
                    output=[]
                    sliceData.forEach((p) => {
                        output.push({
                            name:'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida',
                            url:p.url,
                            score:p.searchscore,
                            title:p.title,
                            pr:p.pr,
                        })
                        //p.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
                    });
                    res.status(200).send(output)
                },
            
                default: function () {
                res.status(406).send('Not Acceptable')
                }
            })
        }
        else{
            res.status(406).send('This format is not supported');
        }
    }
    //res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'personal'}); 
});

// View specific page data from personal collection
app.get('/personal/:id', function (req, res) {
    const id = req.params.id;
    const page = personalPages.find(page => page._id.toString() == id);
    res.status(200).render('app', {page: page, type: 'personal'}); 
});

// View specific page data from personal collection in JSON
// app.get('/personal/:id/JSON', function (req, res) {
//     const id = req.params.id;
//     const page = personalPages.find(page => page._id.toString() == id);
//     // page.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
//     res.setHeader('Content-Type', 'application/json');
//     res.status(200).json(page);
// }); 

// Search results for fruits collection
app.get('/fruits', function (req, res) {
    let q = req.query.q;
    let boost = req.query.boost||'false';
    let limit = req.query.limit||10;
    if(q==""){
        console.log("EMPTY INPUT NO BUENO")
        res.status(200).render('app', {search: true,error:"NO EMPTY INPUT"});
    }else{

        if (limit > 50 || limit < 1) {
            res.status(400).render('app', {search: true});
        }

        let results = [];
        let page_list = [];

        results = fruitPagesSearch.search(q, {expand: true});
        results.forEach((result) => {
            p = fruitPages.find(page => page._id.toString() == (result.ref));
            if (boost == 'true') {
                p.searchscore = (result.score * p.pr);
            }else{
                p.searchscore=result.score
            }
            page_list.push(p);
        });
        if (page_list.length < parseInt(limit)) {
            page_list = appendRandomResults(page_list, parseInt(limit), fruitPages);
        }
        page_list.sort((a, b) => {
            return b.searchscore - a.searchscore;
        })
        if(!page_list){
            res.status(404).send("fruits ID not found in store")
        }
        else if(page_list){
            res.format({
                'text/plain': function () {
                    res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'fruits'});
                },
            
                'text/html': function () {
                    res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'fruits'});
                },
            
                'application/json': function () {
                    let sliceData=page_list.slice(0,parseInt(limit));
                    output=[]
                    sliceData.forEach((p) => {
                        output.push({
                            name:'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida',
                            url:p.url,
                            score:p.searchscore,
                            title:p.title,
                            pr:p.pr,
                        })
                        //p.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
                    });
                    res.status(200).send(output)
                },
            
                default: function () {
                res.status(406).send('Not Acceptable')
                }
            })
        }
        else{
            res.status(406).send('This format is not supported');
        }
    //res.status(200).render('app', {results: page_list.slice(0,parseInt(limit)), type: 'fruits'}); 
    }
});

// View specific page data from fruits collection
app.get('/fruits/:id', function (req, res) {
    const id = req.params.id;
    const page = fruitPages.find(page => page._id.toString() == id);
    res.status(200).render('app', {page: page, type: 'fruits'}); 
});

// View specific page data from fruits collection in JSON
// app.get('/fruits/:id/JSON', function (req, res) {
//     const id = req.params.id;
//     const page = fruitPages.find(page => page._id.toString() == id);
//     // page.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
//     res.setHeader('Content-Type', 'application/json');
//     res.status(200).json(page);
// });

//Start the server
app.listen(port, () => {
    console.log(`Now listening on port ${port}`); 
});


/*
// Search results for personal collection in JSON
app.get('/personal/JSON', function (req, res) {
    let q = req.query.q;
    let boost = req.query.boost;
    let limit = req.query.limit;

    if (limit > 50 || limit < 1) {
        res.status(400).render('app', {search: true});
    }

    let results = [];
    let page_list = [];

    results = personalPagesSearch.search(q,{expaned: true});
    results.forEach((result) => {
        p = personalPages.find(page => page._id.toString() == (result.ref));
        p.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
        if (boost == 'true') {
            p.searchscore = (result.score * p.pr);
        } else {
            p.searchscore = result.score;
        }
        page_list.push(p);
    });
    page_list.sort((a, b) => {
        return b.searchscore - a.searchscore;
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(page_list.slice(0,parseInt(limit)));
});
*/

/*
// Search results for fruits collection in JSON
app.get('/fruits/JSON', function (req, res) {
    let q = req.query.q;
    let boost = req.query.boost;
    let limit = req.query.limit;

    if (limit > 50 || limit < 1) {
        res.status(400).render('app', {search: true});
    }

    let results = [];
    let page_list = [];

    results = fruitPagesSearch.search(q, {expand: true});
    results.forEach((result) => {
        p = fruitPages.find(page => page._id.toString() == (result.ref));
        p.name = 'Johnathan Scaife,  Ali Hassan Sharif,  Nirmith D\'Almeida';
        if (boost == 'true') {
            p.searchscore = (result.score * p.pr);
        } else {
            p.searchscore = result.score;
        }
        page_list.push(p);
    });
    if (page_list.length < parseInt(limit)) {
        page_list = appendRandomResults(page_list, parseInt(limit), fruitPages);
    }
    page_list.sort((a, b) => {
        return b.searchscore - a.searchscore;
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(page_list.slice(0,parseInt(limit)));
});
*/