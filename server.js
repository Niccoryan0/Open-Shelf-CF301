'use strict';

// Packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Global vars
const PORT = process.env.PORT;
const app = express();
const methodOverride = require('method-override');

function Book(obj) {
  this.title = obj.title ? obj.title : 'Unknown Title';
  this.author = obj.authors ? obj.authors[0] : 'Unknown Author';
  if(obj.imageLinks && obj.imageLinks.smallThumbnail[4] === ':') {
    obj.imageLinks.smallThumbnail = obj.imageLinks.smallThumbnail.split(':').join('s:');
  }
  this.img = obj.imageLinks ? obj.imageLinks.smallThumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
  this.descrip = obj.description ? obj.description : 'No Description Available, Sorry.';
  this.isbn = obj.industryIdentifiers ? obj.industryIdentifiers[0].identifier : 'No ISBN found';
  this.shelf = 'All';
}

// Config
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', console.error);
client.connect();
// Middleware
app.use(express.static('./public')); // serves static files from the public folder to make them accessible
app.use(express.urlencoded({extended: true})); // puts form info into req.body
app.use(methodOverride('_overrideMethod'));

// Routes
app.set('view engine', 'ejs');

app.get('/', getSqlForHome);

app.get('/searches/new', (req, res) => res.render('pages/searches/new'));

app.post('/searches', handleSearch);

app.get('/books/:id', bookDetails);

app.post('/books', bookDetailsSql);

app.get('/resetDatabase', resetDatabase);

// Updating a single book, using methodOverride to use put:
app.put('/books/:id/update', updateBook);

app.delete('/books/:id/delete', deleteBook);


function deleteBook(req,res){
  const sqlDelete = `DELETE FROM books WHERE id=$1`;
  const sqlVal = [req.params.id];
  client.query(sqlDelete, sqlVal)
    .then(() => res.redirect('/'))
    .catch(err => handleErrors(err, res));
}

function updateBook(req,res){
  const sqlUpdate = `UPDATE books
  SET title = $1, author = $2, img = $3, descrip = $4, isbn = $5, shelf = $6
  WHERE id=$7`;
  const updateValues = [req.body.title, req.body.author, req.body.img, req.body.descrip, req.body.isbn, req.body.shelfInp || req.body.shelfSel, req.params.id];

  client.query(sqlUpdate, updateValues)
    .then(() => res.redirect(`/books/${req.params.id}`))
    .catch(err => handleErrors(err, res));
}

function getSqlForHome(req,res) {
  client.query('SELECT * FROM books')
    .then(result => res.render('pages/index', {'newBooks' : result.rows}))
    .catch(err => handleErrors(err, res));
}

function handleSearch(req,res) {
  let apiUrl;
  req.body['search-type'] === 'author' ? apiUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.search}&maxResults=10` : apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.search}&maxResults=10`;
  superagent.get(apiUrl)
    .then(result => handleSuperAgent(result, res))
    .catch(err => handleErrors(err, res));
}

function handleSuperAgent(result, res) {
  const books = result.body.items.map(curVal => new Book(curVal.volumeInfo));
  res.render('pages/searches/show', {'newBooks' : books});
}

function handleErrors(err, res){
  console.error(err);
  res.render('pages/error', {error: err});
}

function bookDetailsSql(req, res){
  const chosenBook = JSON.parse(req.body.chosenBook);
  const sqlQuery = 'INSERT INTO books (title, author, img, descrip, isbn, shelf) VALUES ($1, $2, $3, $4, $5, $6)';
  const valArray = [chosenBook.title, chosenBook.author, chosenBook.img, chosenBook.descrip, chosenBook.isbn, chosenBook.shelf ];
  const sqlShelves = 'SELECT DISTINCT shelf FROM books';
  client.query(sqlQuery, valArray)
    .then(() => {
      client.query(sqlShelves)
        .then(result => {
          res.render('pages/books/show', {'newBook' : chosenBook, 'shelves' : result.rows, displayButtons : false});
        });
    }).catch(err => handleErrors(err, res));
}

function bookDetails(req, res){
  const sqlQuery = 'SELECT * FROM books WHERE id = $1';
  const sqlVal = req.params.id;
  const sqlShelves = 'SELECT DISTINCT shelf FROM books';
  client.query(sqlQuery, sqlVal)
    .then((result1) => {
      client.query(sqlShelves)
        .then(result2 => {
          res.render('pages/books/show', {'newBook' : result1.rows[0], 'shelves' : result2.rows, displayButtons : true});
        });
    })
    .catch(err => handleErrors(err, res));
}

function resetDatabase(req, res) {
  const sqlQuery = `DROP TABLE IF EXISTS books;
  CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    author VARCHAR(255),
    img VARCHAR(255),
    descrip TEXT,
    isbn VARCHAR(255),
    shelf VARCHAR(255)
  );`;
  client.query(sqlQuery);
  res.redirect('/');
}

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
