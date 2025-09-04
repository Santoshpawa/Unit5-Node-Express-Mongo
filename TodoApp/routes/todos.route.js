const express = require("express");
const {
  getTodos,
  addTodos,
  getTodosByQuery,
  updateTodos,
  deleteTodos,
} = require("../controllers/todos.controller");
const todosRouter = express.Router();

// fetching
todosRouter.get("/", getTodos);

//posting route
todosRouter.post("/", addTodos);

//fetching using query params
todosRouter.get("/search", getTodosByQuery);

//updating the status of todos
todosRouter.put("/:id", updateTodos);

//deleating the todo
todosRouter.delete("/:id", deleteTodos);

module.exports = todosRouter;
