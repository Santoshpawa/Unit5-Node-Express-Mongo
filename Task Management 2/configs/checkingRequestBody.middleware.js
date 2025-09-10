const taskModel = require("../models/task.model");

function checkingRequestBody(req, res, next) {
  let { title, description, priority, dueDate } = req.body;
  if (!title || !description || !priority || !dueDate) {
    res.status(406).json({ mag: "Incomplete data" });
    return;
  } else if (taskModel.find({ title: req.body.title })) {
    res.status(406).json({ mag: "Task already present" });
    return;
  } else {
    next();
  }
}

module.exports = checkingRequestBody;
