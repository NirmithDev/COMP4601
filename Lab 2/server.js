const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");
const { MongoClient, ObjectId } = require("mongodb");
app.use('/css',express.static(__dirname+'/style'))
let db;
let dv;

//middleware
app.use(express.urlencoded({ extended: true }));

app.set('views', './pages');
app.set('view engine', 'pug');

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

//load up the product detail page - DB implemented
app.get('/products/:id', async (req, res) => {
  try {
    const requestedProductId = req.params.id; // Get the product ID from the URL
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log(requestedProductId.length)
    if(requestedProductId.length===24){
      // Find the product by _id
      const product = await collection.findOne({ _id: new ObjectId(requestedProductId) });
      if (!product) {
        res.status(404).send("Product ID not found in store");
        return;
      }
  
      const format = req.query.format || "html";
  
      res.format({
        'text/plain': function () {
          res.status(200).send(product);
        },
        
        'text/html': function () {
          res.status(200).render('productDetails', { product: product });
        },
        
        'application/json': function () {
          res.status(200).send(product);
        },
        
        default: function () {
          res.status(406).send('Not Acceptable');
        }
      });
    }else{
      console.log("WE ARE IN HERE")
      console.log(typeof(requestedProductId))
      const product = await collection.findOne({ id: parseInt(requestedProductId)});
      if (!product) {
        res.status(404).send("Product ID not found in store");
        return;
      }
  
      const format = req.query.format || "html";
  
      res.format({
        'text/plain': function () {
          res.status(200).send(product);
        },
        
        'text/html': function () {
          res.status(200).render('productDetails', { product: product });
        },
        
        'application/json': function () {
          res.status(200).send(product);
        },
        
        default: function () {
          res.status(406).send('Not Acceptable');
        }
      });
    }
  } 
  catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});
  

//load add product page
app.get('/addProduct',(req,res)=>{
    res.status(200).render('addProduct')
})

//load reviews for the page when it is clicked
app.get('/productId=:rid/reviews',async (req,res)=>{
    productId = req.params.rid
    collection = db.collection(collectionName);
    const product = await collection.findOne({ _id: new ObjectId(productId) });
    //console.log(product)
    if (!product) {
      res.status(404).send("Product ID not found in store");
      return;
    }

    res.status(200).render('review', { product: product });
})

app.get("/placeOrder",(req,res)=>{
  res.status(200).render('placeOrder',{orders:orderCollection})
})

app.get("/orders/orderID=:oid",async (req,res)=>{
  orderId = req.params.oid;
  console.log(orderId)
  collection = db.collection(collectionOrder);
  const orders = await collection.findOne({ _id: new ObjectId(orderId) });
  res.status(200).render('orderDetails',{order:orders})
})

//get Display orders pages
app.get("/orders",async (req,res)=>{
  //get collection
  collection2 = db.collection(collectionOrder)
  //get all data stored and display via page results
  const orders = await collection2.find({}).toArray();
  console.log(orders)
  //if collection is empty 
  if(orders.length === 0){
    //send error message
    res.status(200).render('dispOrders',{error:"No Orders in Database"})
  }
  // otherwise display all orders
  else{
    res.status(200).render('dispOrders',{searchData:orders})
  }
})

async function getLatestID() {
    try {
      collection = db.collection(collectionName);
  
      const latestProduct = await collection.find().sort({ id: -1 }).limit(1).toArray();
      
      if (latestProduct.length === 0) {
        return 0;
      }
  
      return latestProduct[0].id;
    } catch (error) {
      console.error('Error fetching latest ID:', error);
      return -1;
    }
}
  
// for adding new products - comment for ease in rework and visibility
app.post('/products', async (req, res) => {
    try {
        const newID = await getLatestID() + 1;
        collection = db.collection(collectionName);
  
        const newProduct = {
            name: req.body.name,
            price: parseFloat(parseFloat(req.body.price).toFixed(2)),
            dimensions: { x: req.body.x, y: req.body.y, z: req.body.z },
            stock: parseInt(req.body.stock),
            id: newID,
            reviews: [],
        };
  
      // Insert the new product into the MongoDB collection
        await collection.insertOne(newProduct);
  
        res.status(200).render('addProduct', { error: 'New product has been added' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/newReview/:pid',async (req,res)=>{
    //console.log(req.body)
    try {
        const productId = req.params.pid;
        collection = db.collection(collectionName);
    
        // Find the product by _id
        const product = await collection.findOne({ _id: new ObjectId(productId) });
    
        if (!product) {
            res.status(404).send("Product ID not found in store");
            return;
        }
    
        const newRating = parseInt(req.body.rating);
        
        // Create a new review object and push it to the product's reviews array
        const newReview = { Rating: newRating };
        product.reviews.push(newReview);
    
        // Update the product's reviews in the MongoDB collection
        await collection.updateOne(
            { _id: new ObjectId(productId) },
            { $set: { reviews: product.reviews } }
        );
    
        res.status(200).redirect(`/products/${productId}`);
        } 
    catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
})

//temporary collection to handle orders
let orderCollection = []

app.post("/newOrder/:id", async (req, res) => {
  const productId = req.params.id;
  const qty = parseInt(req.body.qty);

  // Find the product in the database
  const collection = db.collection(collectionName);
  const product = await collection.findOne({ _id: new ObjectId(productId) });

  if (!product) {
    console.log(`Product with ID ${productId} not found.`);
    return res.status(404).send("Product not found.");
  }

  // Check if the requested quantity exceeds available stock
  if (qty > product.stock) {
    console.log(`Quantity exceeds available stock for product ${productId}`);
    return res.status(409).render(`productDetails`, { product: product, error: "Quantity exceeds available stock." });
  }

  // Check if the product is already in the cart
  const existingOrder = orderCollection.find((order) => order.productId === productId);

  if (existingOrder) {
    // If the product is already in the cart, update the quantity
    const newQty = existingOrder.qty + qty;
    if (newQty <= product.stock) {
      existingOrder.qty = newQty;
    } else {
      return res.status(409).render(`productDetails`, {
        product: product,
        error: "Product exists in the cart, and requested stock exceeds current stock",
      });
    }
  } else {
    // If the product is not in the cart, add it as a new order
    if (qty <= product.stock) {
      //, productName: 
      console.log(product)
      orderCollection.push({ productId: productId,productName: product.name,qty: qty });
    } else {
      return res.status(409).render(`productDetails`, {
        product: product,
        error: "Product added to the cart, but requested stock exceeds current stock",
      });
    }
  }

  res.status(200).redirect(`/products/${productId}`);
});


app.post("/cart", async (req, res) => {
  console.log(req.body);
  console.log(orderCollection);
  collection = db.collection(collectionName);
  if (orderCollection.length === 0) {
    // Render the template with an error message
    return res.status(409).send("You cannot order 0 items");
  }
  else{
    if(req.body.purchaserName.length === 0){
      return res.status(409).send("You cannot order WITHOUT A PURCHASER NAME.");;
    }else{
      //iterate over the collection
      let outStock = false
      //create a collection to store all problemativ ID's and then render with 409
      let outStockCollection = []
      console.log("IN LOOP")
      for(a of orderCollection){
        //check if stock is available for item
        console.log(a)
        const product = await collection.findOne({ _id: new ObjectId(a.productId) });
        console.log(a)
        if (!product) {
          console.log(`Product with ID ${a.productId} not found.`);
        } else if (product.stock < a.qty) {
          outStockCollection.push(a.productId)
          console.log(`Insufficient stock for ${a.qty} units of ${product.name}`);
          outStock = true;
          break; // Exit the loop if any item is out of stock
        } else {
          console.log(`Stock is available for ${a.qty} units of ${product.name}`);
        }
        
      }
      if (outStock) {
        return res.status(409).send("Some items are out of stock.");
      } else {
        //update the JSON
        const orderObject = {
          Name: req.body.purchaserName,
          order: orderCollection,
        };
        try {
          await db.collection("orders").insertOne(orderObject);
          console.log("OrderCollection stored in the 'orders' collection.");
        } catch (error) {
          console.error("Error storing orderCollection in the 'orders' collection:", error);
          // Handle the error as needed
        }
        // Update the database and remove items from orderCollection
        for (const a of orderCollection) {
          const product = await collection.findOne({ _id: new ObjectId(a.productId) });

          if (product) {
            const updatedStock = product.stock - a.qty;

            try {
              // Update the stock in the database
              await collection.updateOne(
                { _id: new ObjectId(a.productId) },
                { $set: { stock: updatedStock } }
              );

              console.log(`Stock updated for ${a.qty} units of ${product.name}`);
            } catch (error) {
              console.error(`Error updating stock for ${a.qty} units of ${product.name}: ${error}`);
              // Handle the error as needed
            }
          }
        }
        
        // Clear the orderCollection
        orderCollection = [];
        
        // Render the template with a 201 Created status code and success message
        return res.status(201).render('placeOrder', { orders: orderCollection, error: "Order Created successfully" });
      }
    }
  }
});



// Define the MongoDB connection URL and database name
const url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";
const dbName = "storeDB";

const collectionName = 'products';
const collectionOrder = "orders";
// Create a MongoClient instance
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to database.");

    // Access the database
    db = client.db(dbName);
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