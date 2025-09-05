const express = require("express");
const {
  getAllEmployees,
  addEmployee,
  updateEmployeeById,
  deleteEmployeeById,
} = require("../controllers/employee.controller");

const employeeRouter = express.Router();

//fetching all the employess data
employeeRouter.get("/", getAllEmployees);

//adding new employee
employeeRouter.post("/", addEmployee);

//updating employee
employeeRouter.patch("/:id", updateEmployeeById);

//delete employee
employeeRouter.delete("/:id", deleteEmployeeById);

module.exports = employeeRouter;
