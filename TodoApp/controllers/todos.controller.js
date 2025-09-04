const { getData, saveData } = require("../models/todos.model");
const { get } = require("../routes/todos.route");

// fetching todos from database
function getTodos(req, res) {
  let data = getData();
  res.json(data);
}

// adding todo to database
function addTodos(req, res) {
  let data = getData();
  let newTodo = { ...req.body, id: data.length + 1 };
  data.push(newTodo);
  saveData(data);
  res.json({ msg: "Todo added successfully" });
}

//fetching todos using query params
function getTodosByQuery(req, res) {
  let data = getData();
  let search = data.filter((ele) =>
    ele.title.toLowerCase().includes(req.query.q.toLowerCase())
  );
  console.log();
  if (search.length == 0) {
    res.json({ msg: "No todo found" });
  } else {
    res.json(search);
  }
}

//updating status of todos
function updateTodos(req, res) {
  let id = req.params.id;
  let data = getData();
  let check = false;
  let updatedData = data.map((ele) => {
    if (ele.id == id) {
      ele.completed = true;
      check = true;
      return ele;
    } else {
      return ele;
    }
  });
  if (check) {
    saveData(updatedData);
    res.json({ msg: "Todo updated" });
  } else {
    res.status(404).json({ msg: "Id not present" });
  }
}

//deleating the todos
function deleteTodos(req, res) {
  let data = getData();
  let updatedData = data.filter((ele) => ele.id != req.params.id);
  saveData(updatedData);
  res.json({ msg: "Todo Deleated Successfully" });
}
module.exports = { getTodos, addTodos, getTodosByQuery, updateTodos ,deleteTodos};
