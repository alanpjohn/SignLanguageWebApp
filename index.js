const express = require("express");
const fs=require('fs');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');

// Connection URL
const url = "mongodb+srv://AlanJohn:Claw123@claw-6czxa.mongodb.net/test?retryWrites=true&w=majority";
 
// Database Name
const dbName = 'SignLanguage';

var tmfile = fs.readFileSync('./config/tmclaw.js')
var data=fs.readFileSync('./model/my_model/model.json', 'utf8');
var metadata=fs.readFileSync('./model/my_model/metadata.json', 'utf8');
var corsOptions = {
    origin: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
var bin=fs.readFileSync('./model/my_model/weights.bin')    
app = new express()
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse form data client

app.get("/api/app" , async (req,res)=>{
    res.redirect("https://appsenjoy.com/files/f791253bdfbc0e54cb7c3892192c2e32.apk")
});
app.get("/api/model.json" , async (req,res)=>{
    var words=JSON.parse(data);
    res.send(words)
});

app.get("/api/tmclaw.js" , async (req,res)=>{
    res.send(tmfile)
});
app.get("/api/metadata.json" , async (req,res)=>{
    var words=JSON.parse(metadata);
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
            if(!userHash) throw err;
            assert.equal(null, err);
            if(client == null){
                throw err;
            }
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

app.get("/api/connect", async (req,res)=>{
    // end session
    let userhash = req.query.user
    try{
        await MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
            assert.equal(null, err);
            const db = client.db(dbName);
            let searchquery = {
                userHash : userhash
            }
            var newvalues = { $set: {guest: true, connecttime: Date.now() , log:[]} };
            await db.collection('Sessions').updateOne(searchquery,newvalues);
            client.close();
            //res.send({success:true})
            res.cookie("user",userhash, { expire: 360000 + Date.now()}).redirect("https://www.clawpro.club");
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
try{
io.on('connection', (socket) => {
    let userNickname = "test"
    let room = "test"
    socket.emit('news' , "hello user");
    
    socket.on('join', async function(data) {
                userNickname = data.username;
                room = data.room
                try{
                    await MongoClient.connect(url,{useUnifiedTopology: true}, function(err, client) {
                        assert.equal(null, err);
                        const db = client.db(dbName);
                        let searchquery = {
                            userHash : room
                        }
                        var newvalues = { $set: {guest: true, connecttime: Date.now()} };
                        db.collection("Sessions").findOne(searchquery,async function(err, result) {
                            if (err || !result) throw err;
                            console.log(result)
                            client.close();
                            socket.join(room)
                            io.in(data.room).emit("login",{ numUsers : Object.keys(io.in(data.room).sockets).length || 2 })
                            await MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
                                assert.equal(null, err);
                                const db = client.db(dbName);
                                let searchquery = {
                                    userHash : room
                                }
                                var newvalues = { $set: {guest: true, connecttime: Date.now(), log:[]} };
                                await db.collection('Sessions').updateOne(searchquery,newvalues);
                                client.close();
                                //res.send({success:true})
                            }); 
                        });
                        //res.send({success:true})
                    }); 
                }catch(err){
                    socket.emit("loginfailed" , { success : "false"} )
                }
                
        })
    socket.on('new message' ,async function(data){
        await MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
            assert.equal(null, err);
            const db = client.db(dbName);
            let searchquery = {
                userHash : room
            }
            var newvalues = { $push: { log : {$each : [{ username : userNickname , msg : data , detect:false}]}} };
            db.collection('Sessions').updateOne(searchquery,newvalues);
        }); 
        console.log(room ," : ", userNickname ," : ", data)
        io.in(room).emit("new message" , {username : userNickname , message : data});
    })

    socket.on('word detected' , async function(data){
        MongoClient.connect(url,{useUnifiedTopology: true},async function(err, client) {
            assert.equal(null, err);
            const db = client.db(dbName);
            let searchquery = {
                userHash : room
            }
            var newvalues = { $push: { log : {$each : [{ username : userNickname , msg : data , detect:true}]}} };
            db.collection('Sessions').updateOne(searchquery,newvalues);
        });
    })

    socket.on('typing' , function(){
        io.in(room).emit("typing" , {username : userNickname});
    })

    socket.on('stop typing' , function(){
        io.in(room).emit("stop typing" , {username : userNickname});
    })
    socket.on('disconnect', function() {
            socket.broadcast.emit( "userdisconnect" ,' has left')
        });
    });
}catch(err){
    console.log(err)
}