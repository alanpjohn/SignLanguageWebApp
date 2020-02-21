const express = require("express");
const fs=require('fs');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser')

// Connection URL
const url = "mongodb+srv://AlanJohn:Claw123@claw-6czxa.mongodb.net/test?retryWrites=true&w=majority";
 
// Database Name
const dbName = 'SignLanguage';
 
var data=fs.readFileSync('./model/my_model/model.json', 'utf8');
var metadata=fs.readFileSync('./model/my_model/metadata.json', 'utf8');
var corsOptions = {
    origin: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
var bin=fs.readFileSync('./model/my_model/weights.bin')    
app = new express()
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse form data client


app.get("/api/model.json" , async (req,res)=>{
    var words=JSON.parse(data);
    console.log(words);
    res.send(words)
});
app.get("/api/metadata.json" , async (req,res)=>{
    var words=JSON.parse(metadata);
    console.log(words);
    res.send(words)
});
app.get("/api/weights.bin" , async (req,res)=>{
    res.send(bin)
});

app.post("/api/start", async (req,res,next)=>{
    // starts session 
    // Use connect method to connect to the server
    let userHash = req.body.hash
    let d = Date()
    let date = Date.now();
    try{
    await MongoClient.connect(url,{useUnifiedTopology: true}, async function(err, client) {
        try{
            assert.equal(null, err);
            if(client == null){
                throw err;
            }
            console.log(date)
            const db = client.db(dbName);
            await db.collection('Sessions').insertOne({
                startTime: date,
                userHash: userHash,
                guest: false
            });
            client.close();
            res.send({success : true} );
        }catch(err){
            res.send({success : false});
            console.log(err)
        }   
    });
    }catch(err){
        console.log(err)
        res.send("failed")
    }
});

app.post("/api/end", async (req,res)=>{
    let userhash = req.query.user
    console.log(userhash)
    try{
    await MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
        assert.equal(null, err);
        const db = client.db(dbName);
        let searchquery = {
            userHash : userhash
        }
        //var newvalues = { $set: {guest: true, connecttime: Date.now()} };
        await db.collection('Sessions').deleteOne(searchquery);
        client.close();
        res.send({success:true})
    }); 
    }catch(err){
        console.log(err)
        res.send({success:false})
    }
});

app.post("/api/connect", async (req,res)=>{
    // end session
    let userhash = req.query.user
    console.log(userhash)
    try{
    await MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
        assert.equal(null, err);
        const db = client.db(dbName);
        let searchquery = {
            userHash : userhash
        }
        var newvalues = { $set: {guest: true, connecttime: Date.now()} };
        await db.collection('Sessions').updateOne(searchquery,newvalues);
        client.close();
        res.send({success:true})
    }); 
    }catch(err){
        console.log(err)
        res.send({success:false})
    }
});

var server = require('http').Server(app);
var io = require('socket.io')(server, { origins: '*:*'});

server.listen(3000);
// WARNING: app.listen(80) will NOT work here!

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
