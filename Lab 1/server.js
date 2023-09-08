const express = require('express');
const bodyParser = require('body-parser');
const path=require('path')
const app = express();
const pug = require("pug");

app.use('/css',express.static(__dirname+'/style'))
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
            Author: 'John Doe',
            Rating: 4,
            Comment: 'Great movie!'
        }
        // Add more review objects as needed
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



app.listen(3000)
console.log("listening on port 3000")