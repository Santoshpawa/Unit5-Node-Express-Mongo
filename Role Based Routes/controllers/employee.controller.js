const { getData, saveData } = require("../models/employee.model");

// fetching employee details
function getAllEmployees(req, res) {
  let employees = getData();
  res.json(employees);
}

// adding new employee
function addEmployee(req, res) {
  if (req.headers["x-role"] == "admin") {
    let employees = getData();
    let newEmployee = {
      ...req.body,
      id: employees.length + 1,
    };
    employees.push(newEmployee);
    saveData(employees);
    res.json({ msg: "Employee Added..." });
  } else {
    res.status(406).json({ msg: "Only admin is allowed to add new employee" });
  }
}

// updating employee
function updateEmployeeById(req, res) {
  let id = req.params.id;

  let employees = getData();
  let check = false;
  let updatedRecord = employees.map((ele) => {
    if (ele.id == id) {
      ele = { ...ele, ...req.body };
      check = true;
      return ele;
    } else {
      return ele;
    }
  });
  if (check) {
    saveData(updatedRecord);
    res.json({ msg: `Employee with id : ${id} got updated...` });
  } else {
    res.status(406).json({ msg: `Employee with id: ${id} is not available` });
  }
}

//delete employee
function deleteEmployeeById(req, res) {
  let data = getData();
  let id = req.params.id;
  if (req.headers["x-role"] == "admin") {
    let updatedData = data.filter((ele) => ele.id != id);
    if (data.length == updatedData.length) {
      res.status(406).json({ msg: `Employee with id: ${id} is not available` });
    } else {
      saveData(updatedData);
      res.json({ msg: "Employee deleated" });
    }
  } else {
    res.json({ msg: "Only admin is allowed to delete employee" });
  }
}

module.exports = { getAllEmployees, addEmployee, updateEmployeeById ,deleteEmployeeById};
