const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");
const { MongoClient } = require("mongodb");
app.use('/css',express.static(__dirname+'/style'))
let db;

//middleware
app.use(express.urlencoded({ extended: true }));

app.set('views', './pages');
app.set('view engine', 'pug');

let orderCollection = []
//when user adds a order it just updates it and we display it
// when i click on the cart button it leads to a order page and 
// get cart button page 


//take in all the data from the products.json file
let data=require('./products.json')
//console.log(data)

//creating a new collection to add review section to it
let dataUpdate=[]
for(a=0;a<data.length;a++){
    let products = { ...data[a] };
    
    // Add the "reviews" property to the movie object
    products.reviews = [
        /*{
            Rating: 4
        }*/
        
    ];
    
    dataUpdate.push(products)
}
//console.log(dataUpdate)
//default home page
app.get('/',async (req,res)=>{
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const products = await collection.find({}).toArray();
    console.log(products)
    res.status(200).render('home',{searchData:products});
})

app.get('/products',async (req,res)=>{
    console.log(req.query);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    if(req.query.query.length==0){
        //console.log(req.query.searchType);
        if(req.query.searchType==='all'){
            const products = await collection.find({}).toArray();
            res.status(200).render('home',{searchData:products});
        }else{
            //check for only in stock items
            //create a collection to contain this
            const condition = { stock: { $gt: 0 } };

            // Find documents matching the condition
            const inStockItems = await collection.find(condition).toArray();
            //console.log(inStockItems)
            res.status(200).render('home',{searchData:inStockItems});
        }
    }else{
        //render all data in here that MATCHES THE INPUT FROM THE USER
        //check the dropdown options
        //all products
        //collections match requirement
        if(req.query.searchType==='all'){
            const query = {
                name: { $regex: new RegExp(req.query.query, 'i') } // Case-insensitive search
              };
          
              const matchingItems = await collection.find(query).toArray();
          
              if (matchingItems.length > 0) {
                res.status(200).render('home', { searchData: matchingItems });
              } else {
                res.status(200).render('home', { error: 'No matching products found' });
              }
        }
        //in stock 
        else{
            const query = {
                name: { $regex: new RegExp(req.query.query, 'i') },
                stock: { $gt: 0 } // Stock greater than 0
              };
          
              // Find documents matching the query
              const matchingItems = await collection.find(query).toArray();
          
              if (matchingItems.length > 0) {
                res.status(200).render('home', { searchData: matchingItems });
              } else {
                // Check if there are products with the name but not in stock
                const notStockedQuery = {
                  name: { $regex: new RegExp(req.query.query, 'i') },
                  stock: 0
                };
                const notStockedItems = await collection.find(notStockedQuery).toArray();
          
                if (notStockedItems.length > 0) {
                  res.status(200).render('home', { error: 'Item Not Stocked' });
                } else {
                  res.status(200).render('home', { error: 'No matching products found' });
                }
            }
        }
    }
})

//load up the product detail page
app.get('/products/:pid',(req,res)=>{
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    //console.log(collection)
    const productId = req.params.pid;
    //console.log(req.query.format)
    format = req.query.format || "html"
    const product = dataUpdate.find(item => item.id.toString() === productId);
    console.log(product)
    if(!product){
        res.status(404).send("Product ID not found in store")
    }
    else if(product){
        res.format({
            'text/plain': function () {
              res.status(200).send(product);
            },
          
            'text/html': function () {
                res.status(200).render('productDetails',{product:product});
            },
          
            'application/json': function () {
                res.status(200).send(product)
            },
          
            default: function () {
              res.status(406).send('Not Acceptable')
            }
        })
    }
    else{
        res.status(406).send('This format is not supported');
    }
})

//load add product page
app.get('/addProduct',(req,res)=>{
    res.status(200).render('addProduct')
})

//load reviews for the page when it is clicked
app.get('/productId=:rid/reviews',(req,res)=>{
    console.log(req.params.rid)
    //find data that matches the id
    const product = dataUpdate.find(item => item.id.toString() === req.params.rid);
    console.log(product)
    res.status(200).render('review',{product:product});
})


function getID(){
    const lastObj = dataUpdate[dataUpdate.length - 1];
    //console.log(lastObj.id)
    return lastObj.id;
}

//post request to add Products
app.post('/products',(req,res)=>{
    console.log(req.body)
    //store it to a new object before appending to dataUpdate
    //get latest ID from dataUpdate
    let newID = getID()
    newID =  newID+1
    let newProduct = {
        name: req.body.name,
        price: parseFloat(parseFloat(req.body.price).toFixed(2)),
        dimensions: {x:req.body.x,y:req.body.y,z:req.body.z},
        stock:parseInt(req.body.stock),
        id:newID,
        reviews:[]
    }
    //console.log(newProduct)
    //console.log(req)
    dataUpdate.push(newProduct)
    res.status(200).render('addProduct',{error:" New product has been added "})
})

app.post('/newReview/:pid',(req,res)=>{
    //console.log(req.body)
    const productId = req.params.pid;
    //console.log(productId)
    const product = dataUpdate.find(item => item.id.toString() === productId);
    //console.log(product)
    
    console.log(req.body.rating)
    if(req.body.rating){
        newRating = {Rating:parseInt(req.body.rating)};
        product.reviews.push(newRating);
        //console.log(product)
        res.status(200).redirect(`/products/${productId}`)
    }else{
        res.status(200).redirect(`/products/${productId}`)
    }
})

//connecting to local DB
//const { MongoClient } = require("mongodb");

// Define the MongoDB connection URL and database name
const url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";
const dbName = "storeDB";
const collectionName = 'products';
// Create a MongoClient instance
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

// Use async/await for better handling of asynchronous operations
async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to database.");

    // Access the database
    const db = client.db(dbName);
    //const collection = db.collection(collectionName);

    //const documents = await collection.find({}).toArray();
    //console.log('Documents in the collection:', documents);
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

// Call the main function to start the connection
main();


app.listen(3000)
console.log("listening on port 3000")