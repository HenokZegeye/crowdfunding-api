
const mongoose = require('mongoose');
require('dotenv').config();

// To connect Mongoose to our MongoDB service
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

//To test if the connection is successful  or not 
const db = mongoose.connection
db.on('error', console.error.bind(console, 'Mongodb Database Connection Error:'));
db.once('open', function () {
    console.log("MongoDb database Successfully connected !!");
});

module.exports= mongoose;

/*const mongoose = require('mongoose');
require('dotenv').config();

// To connect Mongoose to our MongoDB service
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

//To test if the connection is successful  or not 
const db = mongoose.connection
db.on('error', console.error.bind(console, 'Mongodb Database Connection Error:'));
db.once('open', function () {
    console.log("MongoDb database Successfully connected !!");
});

module.exports= db;
*/