const express = require("express");
const employeeRouter = require("./routes/employee.route");

const app = express();

app.use(express.json());

app.use("/employee", employeeRouter);


app.listen(3000,()=>{
    console.log("Server is listening to the incoming request");
})