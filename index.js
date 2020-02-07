const express = require("express");
const fs=require('fs');
const cors = require('cors')
var data=fs.readFileSync('./model/my_model/model.json', 'utf8');
var metadata=fs.readFileSync('./model/my_model/metadata.json', 'utf8');
var corsOptions = {
    origin: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
var bin=fs.readFileSync('./model/my_model/weights.bin')    
app = new express()
app.use(cors(corsOptions));
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


app.listen(3000 , () => {
    console.log("listening")
})

