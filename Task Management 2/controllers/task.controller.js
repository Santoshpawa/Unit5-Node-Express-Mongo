const taskModel = require("../models/task.model");

// fetching tasks
async function getAllTasks(req, res) {
  try {
    let tasks = await taskModel.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
}

//posting a new task
async function addTask(req, res) {
  try {
    await taskModel.create(req.body);
    res.json({ msg: "New task added" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
}

// update a task
async function updateTaskById(req, res) {
  try {
    let id = req.params.id;
    console.log(req.params)
    await taskModel.findByIdAndUpdate(id, req.body);
    res.status(200).json({msg: "Task updated"})
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
}

//delete a task
async function deleteTaskById(req, res) {
  try {
    let id = req.params.id;
    console.log(req.params)
    await taskModel.findByIdAndDelete(id);
    res.status(200).json({msg: "Task deleted"})
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
}

module.exports = { getAllTasks, addTask , updateTaskById, deleteTaskById};
