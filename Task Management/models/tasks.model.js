const mongoose = require("mongoose");

const taskSchema = mongoose.Schema({
  title: String,
  description: String,
  status: String,
  dueDate: Date,
});

const taskModel = mongoose.model("tasks", taskSchema);

module.exports = taskModel;
