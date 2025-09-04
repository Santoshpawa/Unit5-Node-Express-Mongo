const { getData, saveData } = require("../models/ticket.model");
const { get } = require("../routes/ticket.route");

// fetching the tickets
function getTickets(req, res) {
  let data = getData();
  res.json(data);
}

//adding tickets
function addTickets(req, res) {
  let data = getData();
  let newTicket = { ...req.body, id: data.length + 1 };
  data.push(newTicket);
  saveData(data);
  res.json({ msg: "Ticket generated successfully..." });
}

//fetching ticket by id
function getTicketById(req,res){
    let data = getData();
    let search = data.filter((ele)=>ele.id == req.params.id);
    if(search.length ==0){
        res.status(404).json({msg: "Ticket id not available"})
    }else{
        res.json(search);
    }
}

//updating ticket by id
function updateTicketById(req,res){
    let data = getData();
    let updatedData = data.map((ele)=>{
        if(ele.id == req.params.id){
            ele = { ...ele, ...req.body};
            return ele;
        }else{
            return ele;
        }
    })
    saveData(updatedData);
    res.json({msg:"Ticket updated successfully"})
}

//delete ticket by id
function deleteTicketById(req,res){
    let data = getData();
    let updatedData = data.filter((ele)=>ele.id != req.params.id);
    saveData(updatedData);
    res.json({msg:"Ticket deleated successfully"});
}

module.exports = { getTickets, addTickets, getTicketById, updateTicketById, deleteTicketById}