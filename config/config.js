const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = "mongodb+srv://AlanJohn:Claw123@claw-6czxa.mongodb.net/test?retryWrites=true&w=majority";
 
// Database Name
const dbName = 'SignLanguage';
 
// Use connect method to connect to the server
MongoClient.connect(url,{useUnifiedTopology: true}, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
 
  const db = client.db(dbName);
 
  client.close();
});
