DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  img VARCHAR(255),
  descrip TEXT,
  isbn VARCHAR(255),
  shelf VARCHAR(255)
);