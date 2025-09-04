const express = require("express");
const {
  getTickets,
  addTickets,
  getTicketById,
  updateTicketById,
  deleteTicketById,
} = require("../controllers/ticket.controller");
const datacheck = require("../middlewares/datacheck");
const ticketRouter = express.Router();

//fetching the data
ticketRouter.get("/", getTickets);

// adding new ticket
ticketRouter.post("/", datacheck, addTickets);

//fetching ticket by id
ticketRouter.get("/:id", getTicketById);

//updating ticket by id
ticketRouter.put("/:id", updateTicketById);

//delete ticket by id
ticketRouter.delete("/:id", deleteTicketById);

module.exports = ticketRouter;
