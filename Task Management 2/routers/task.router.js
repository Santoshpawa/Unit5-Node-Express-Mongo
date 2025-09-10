const express = require("express");
const { getAllTasks, addTask, updateTaskById, deleteTaskById } = require("../controllers/task.controller");
const checkingRequestBody = require("../configs/checkingRequestBody.middleware");


const taskRouter = express.Router();

taskRouter.get('/', getAllTasks);

//adding a task
taskRouter.post("/", checkingRequestBody, addTask);

//update a task
taskRouter.patch("/:id", updateTaskById);

//delete a task
taskRouter.delete("/:id", deleteTaskById);

module.exports = taskRouter;