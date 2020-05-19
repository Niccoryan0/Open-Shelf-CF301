'use strict';

// Packages
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
var path = require('path');
require('dotenv').config();



// Global vars
const PORT = process.env.PORT;
const app = express();
app.use(express.static('./public')); //helps the frontend

// Config
app.use(cors());

// Routes
// app.set('views', path.join(__dirname, 'views') );
app.set('view engine', 'ejs');

app.get('/hello', (req,res) => {
  res.render('index');
});






app.listen(PORT, console.log(`Listening on  ${PORT}`));
