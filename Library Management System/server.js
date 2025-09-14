const express = require("express");
const connectToDb = require("./configs/mongo.config");
const bookRouter = require("./routes/book.router");
const memberRouter = require("./routes/member.router");
require("dotenv").config();
const app = express();

app.use(express.json());


app.use("/books", bookRouter);

app.use("/members",memberRouter);

app.use((req,res)=>{
    res.json({msg: "Undefined Route"});
})

connectToDb().then(()=>{
    app.listen(process.env.Server_Port,()=>{
        console.log("Server has started listening at port 3000")
    })
})
