'use strict';

// Packages
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();



// Global vars
const PORT = process.env.PORT;
const app = express();
app.use(express.static('./public')); //helps the frontend

function Book(obj) {
  this.title = obj.title ? obj.title : 'Unknown Title';
  this.author = obj.authors ? obj.authors[0] : 'Unknown Author';
  if(obj.imageLinks && obj.imageLinks.smallThumbnail[4] === ':') {
    obj.imageLinks.smallThumbnail = obj.imageLinks.smallThumbnail.split(':').join('s:');
  }
  this.img = obj.imageLinks ? obj.imageLinks.smallThumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
  this.desc = obj.description ? obj.description : 'No Description Available, Sorry.';
}

// Config
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', console.error);
client.connect();
// For Form Use
app.use(express.static('./Public'));
app.use(express.urlencoded({extended: true}));

// Routes
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  client.query('SELECT * FROM books')
    .then(result => res.render('pages/index', {'newBooks' : result.rows}));
});

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new');
});

app.post('/searches', (req, res) => {
  let apiUrl;
  req.body['search-type'] === 'author' ? apiUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.search}` : apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.search}`;
  superagent.get(apiUrl)
    .then(result => {
      const books = result.body.items.map(curVal => new Book(curVal.volumeInfo));
      const sqlQuery = 'INSERT INTO books (title, author, img, descrip) VALUES ($1, $2, $3, $4)';
      books.forEach(val =>{
        const valArray = [val.title, val.author, val.img, val.desc];
        client.query(sqlQuery, valArray);
      });
      res.render('pages/searches/show', {'newBooks' : books});
    }).catch(err => res.render('pages/error', {error: err}));
});

app.get('/tasks/:id', (req, res) => {
  // req.params comes back {id : id} when visiting tasks/:id
  // when visiting tasks/scoobydoo the id comes back {id : scoobydoo}
  const sqlQuery = `SELECT * FROM books WHERE title = ${req.params.id}`;
  client.query(sqlQuery)
    .then(result => res.render('pages/books/show', {book : result.rows[0]}));
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
