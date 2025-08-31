const EventEmitter = require("node:events");
class MyEmitter extends EventEmitter {}
const fs = require("fs");

const myEmitter = new MyEmitter();

function enventLog() {
  let result = null;

  myEmitter.on("event", () => {
    result = {
      status: "Event logged",
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };
    fs.appendFileSync(
      "./events.txt",
      `\n{status: ${result.status}, time: ${result.time}}`
    );
  });
  myEmitter.emit("event");
  return result;
}

module.exports = enventLog;
