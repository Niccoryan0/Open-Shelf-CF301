'use strict';

// Packages
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();



// Global vars
const PORT = process.env.PORT;
const app = express();
app.use(express.static('./public')); //helps the frontend

function Book(obj) {
  this.title = obj.title;
  this.author = obj.authors[0];
  this.img = obj.imageLinks.smallThumbnail;
  this.desc = obj.description;
}

// Config
app.use(cors());

// For Form Use

app.use(express.static('./Public'));
app.use(express.urlencoded({extended: true}));

// Routes
app.set('view engine', 'ejs');

app.get('/hello', (req, res) => {
  res.render('pages/index');
});

app.get('/searches/new', (req, res) => {
  res.render('Pages/searches/new');
});

app.post('/searches', (req, res) => {
  let apiUrl;
  console.log('request:       ', req.body);
  req.body.author ? apiUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.search}` : apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.search}`;
  superagent.get(apiUrl)
    .then(result => {
      const books = result.body.items.map(curVal => new Book(curVal.volumeInfo));
      res.render('Pages/searches/show', {'newBooks' : books});
    });

});


app.listen(PORT, () => console.log(`Listening on ${PORT}`));
