const { MongoClient } = require('mongodb');
const dbName = "storeDB";

// MongoDB connection URL
const url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.6";

// Create a MongoClient instance
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

// Use async/await for better handling of asynchronous operations
async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to database.");

    // Access the database using client.db(dbName)
    const db = client.db(dbName);

    // Drop the existing "storeDB" database if it exists
    await db.dropDatabase();
    console.log("Dropped 'storeDB' database.");

    // Your database operations here, e.g., inserting, querying, and updating documents
    const productsData = require("./products.json"); // Load your product data from a JSON file
    //const orderData = require("./orderCollection")
    // Modify the product data to ensure reviews field is an empty array
    const modifiedProductsData = productsData.map(product => ({
      ...product,
      reviews: [], // Ensure an empty array for reviews
    }));

    // Insert modified data into the "products" collection
    const productsCollection = db.collection("products");
    const insertResult = await productsCollection.insertMany(modifiedProductsData);
    console.log(`Inserted ${insertResult.insertedCount} documents into 'products' collection`);

    const ordersCollection = db.collection("orders")
    console.log("COLLECTION CREATED")
    //const insertResult2 = await productsCollection.insertMany(modifiedProductsData);
    //console.log(`Inserted ${insertResult2.insertedCount} documents into 'products' collection`);


  } catch (err) {
    console.error("Error connecting to the database:", err);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

main();
