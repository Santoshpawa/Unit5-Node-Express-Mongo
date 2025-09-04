function datacheck(req, res, next) {
  let { title, priority, status } = req.body;
  if (!title || !priority || !status) {
    res.status(406).json({ msg: "The schema of data is not correct" });
  } else {
    next();
  }
}

module.exports = datacheck;
