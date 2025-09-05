function bookStructure(req, res, next) {
  let { title, author,  status , genre, publishedYear} = req.body;
  if (!title || !author || !status || !genre || !publishedYear) {
    res.status(406).json({ msg: "Please add book in a particular format" });
  } else {
    next();
  }
}

module.exports = bookStructure;
