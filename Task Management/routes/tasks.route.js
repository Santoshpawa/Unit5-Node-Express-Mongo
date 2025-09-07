const express = require("express");
const { getAllTasks, addTask, deleteTaskById, updateTaskById } = require("../controllers/tasks.controller");

const taskRouter = express.Router();

// fetching data from database
taskRouter.get("/", getAllTasks);

// adding task to the database
taskRouter.post("/", addTask);

// update task by ID
taskRouter.patch("/:id", updateTaskById);

// delete task by ID
taskRouter.delete("/:id", deleteTaskById);



module.exports = taskRouter;
