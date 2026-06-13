const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const getAllBooks = () =>
  new Promise((resolve) => {
    resolve(books);
  });

const getBookByISBN = async (isbn) => {
  const response = await axios.get(`http://127.0.0.1:5000/isbn/${isbn}`);
  return response.data;
};

const getBooksByAuthor = async (author) => {
  const response = await axios.get(`http://127.0.0.1:5000/author/${encodeURIComponent(author)}`);
  return response.data;
};

const getBooksByTitle = async (title) => {
  const response = await axios.get(`http://127.0.0.1:5000/title/${encodeURIComponent(title)}`);
  return response.data;
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  getAllBooks()
    .then((bookList) => res.status(200).json(bookList))
    .catch(() => res.status(500).json({ message: "Unable to fetch books" }));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const { isbn } = req.params;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Use direct lookup for local requests and async Axios for the course requirement.
  if (req.get("x-internal-axios-request") === "true") {
    return res.status(200).json({ [isbn]: books[isbn] });
  }

  try {
    const book = await getBookByISBN(isbn);
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch book by ISBN" });
  }
 });
  
public_users.get('/author/:author', async function (req, res) {
  const { author } = req.params;
  const filteredBooks = Object.entries(books).filter(
    ([, book]) => book.author.toLowerCase() === author.toLowerCase()
  );

  if (req.get("x-internal-axios-request") === "true") {
    return res.status(200).json(
      Object.fromEntries(filteredBooks)
    );
  }

  try {
    const data = await getBooksByAuthor(author);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch books by author" });
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const { title } = req.params;
  const filteredBooks = Object.entries(books).filter(
    ([, book]) => book.title.toLowerCase() === title.toLowerCase()
  );

  if (req.get("x-internal-axios-request") === "true") {
    return res.status(200).json(
      Object.fromEntries(filteredBooks)
    );
  }

  try {
    const data = await getBooksByTitle(title);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch books by title" });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const { isbn } = req.params;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(books[isbn].reviews);
});

axios.interceptors.request.use((config) => {
  config.headers["x-internal-axios-request"] = "true";
  return config;
});

module.exports.general = public_users;
