const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");

app.use('/css',express.static(__dirname+'/style'))
//middleware
app.use(express.urlencoded({ extended: true }));

app.set('views', './pages');
app.set('view engine', 'pug');

//take in all the data from the products.json file
let data=require('./products.json')
//console.log(data)

//creating a new collection to add review section to it
let dataUpdate=[]
for(a=0;a<data.length;a++){
    let products = { ...data[a] };
    
    // Add the "reviews" property to the movie object
    products.reviews = [
        {
            Rating: 4
        }
        
    ];
    
    dataUpdate.push(products)
}
//console.log(dataUpdate)
//default home page
app.get('/',(req,res)=>{
    //console.log(dataUpdate.length)
    res.status(200).render('home',{searchData:dataUpdate});
})

app.get('/searchProduct',(req,res)=>{
    console.log(req.query);
    if(req.query.query.length==0){
        //console.log(req.query.searchType);
        if(req.query.searchType==='all'){
            res.status(200).render('home',{searchData:dataUpdate});
        }else{
            //check for only in stock items
            //create a collection to contain this
            const inStockItems = []
            for (const a of dataUpdate) {
                if(a.stock!==0){
                    inStockItems.push(a);
                }
            }
            res.status(200).render('home',{searchData:inStockItems});
        }
    }else{
        //render all data in here that MATCHES THE INPUT FROM THE USER
        //check the dropdown options
        //all products
        //collections match requirement
        const itemMatch = []
        if(req.query.searchType==='all'){
            for (const a of dataUpdate) {
                if(a.name.toLowerCase().includes(req.query.query.toLowerCase())){
                    itemMatch.push(a);
                }
            }
            if(itemMatch.length>0){
                res.status(200).render('home',{searchData:itemMatch});
            }else{
                res.status(200).render('home', { error: 'No matching products found' })
            }
        }
        //in stock 
        else{
            let stocked = false;
            for (const a of dataUpdate) {
                if(a.name.includes(req.query.query) && a.stock>0){
                    itemMatch.push(a);
                    stocked = true;
                }
            }
            if(itemMatch.length>0){
                res.status(200).render('home',{searchData:itemMatch});
            }else{
                res.status(200).render('home', { error: 'No matching products found' })
            }
        }
    }
})

//load up the product detail page
app.get('/product/:pid',(req,res)=>{
    const productId = req.params.pid;
    //console.log(req.query.format)
    format = req.query.format || "html"
    const product = dataUpdate.find(item => item.id.toString() === productId);
    console.log(product)
    if(!product){
        res.status(404).send("Product ID not found in store")
    }else if(format === 'json'){
        res.status(200).send(product)
    }else if(format === 'html'){
        res.status(200).render('productDetails',{product:product});
    }
    else{
        res.status(406).send('This format is not supported');
    }
})

//load add product page
app.get('/addProduct',(req,res)=>{
    res.status(200).render('addProduct')
})

function getID(){
    const lastObj = dataUpdate[dataUpdate.length - 1];
    //console.log(lastObj.id)
    return lastObj.id;
}

//post request to add Products
app.post('/submit',(req,res)=>{
    console.log(req.body)
    //store it to a new object before appending to dataUpdate
    //get latest ID from dataUpdate
    let newID = getID()
    newID =  newID+1
    let newProduct = {
        name: req.body.name,
        price: parseInt(req.body.price),
        dimensions: {x:req.body.x,y:req.body.y,z:req.body.z},
        stock:parseInt(req.body.stock),
        id:newID,
        reviews:[]
    }
    console.log(newProduct)
    //console.log(req)
    dataUpdate.push(newProduct)
    res.status(200).render('addProduct')
})

app.post('/sendNewReview/:pid',(req,res)=>{
    console.log(req.body)
    const productId = req.params.pid;
    console.log(productId)
    const product = dataUpdate.find(item => item.id.toString() === productId);
    console.log(product)
    newRating = {Rating:parseInt(req.body.rating)};
    product.reviews.push(newRating);
    console.log(product)
    res.status(200).redirect(`/product/${productId}`)
})

app.listen(3000)
console.log("listening on port 3000")