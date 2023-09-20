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

app.get('/',async (req,res)=>{
    res.status(200).render('home');
})


app.listen(3000)
console.log("listening on port 3000")