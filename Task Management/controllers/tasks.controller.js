const taskModel = require("../models/tasks.model");

// fetching all tasks from the database
async function getAllTasks(req, res) {
  let data = await taskModel.find();
  res.json(data);
}

// adding new tasks

async function addTask(req, res) {
  try {
    await taskModel.create(req.body);
    res.json({ msg: "Task added to database;" });
  } catch (error) {
    console.log("Task could not be added to database");
  }
}

// update task
async function updateTaskById(req, res) {
  const { id } = req.params;
  let task = await taskModel.findById(id);
  if (!task) {
    res.status(400).json({ msg: "Task not found" });
    return;
  }
  try {
    await taskModel.findByIdAndUpdate(id, req.body);
    res.json({ msg: "Task updated" });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
  }
}

//delete task
async function deleteTaskById(req, res) {
  const { id } = req.params;
  let task = await taskModel.findById(id);
  if (!task) {
    res.status(400).json({ msg: "Task not found" });
    return;
  }
  try {
    await taskModel.findByIdAndDelete(id);
    res.json({ msg: "Task Deleted " });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
  }
}

module.exports = { getAllTasks, addTask, updateTaskById, deleteTaskById };
