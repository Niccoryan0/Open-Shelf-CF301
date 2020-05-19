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
  this.title = obj.title ? obj.title : 'Unknown Title';
  this.author = obj.authors ? obj.authors[0] : 'Unknown Author';
  this.img = obj.imageLinks ? obj.imageLinks.smallThumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
  this.desc = obj.description ? obj.description : 'No Description Available, Sorry.';
}

// Config
app.use(cors());

// For Form Use

app.use(express.static('./Public'));
app.use(express.urlencoded({extended: true}));

// Routes
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new');
});

app.post('/searches', (req, res) => {
  let apiUrl;
  console.log('request:       ', req.body);
  req.body['search-type'] === 'author' ? apiUrl = `ttps://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.search}` : apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.search}`;
  superagent.get(apiUrl)
    .then(result => {
      const books = result.body.items.map(curVal => new Book(curVal.volumeInfo));
      res.render('pages/searches/show', {'newBooks' : books});
    }).catch(err => res.render('pages/error', {errors : [err]}));
});


app.listen(PORT, () => console.log(`Listening on ${PORT}`));
