const os = require("os");

function systemDetails() {
  let data = os.cpus();

  console.log("Architecture:", os.arch());
  console.log("CPU Cores:", data.length);
  console.log("CPU Model:", data[0].model);
  console.log("CPU Speed:", data[0].speed + " MHz"); // better than parsing the string

  console.log("Total Memory:", (os.totalmem() / 1024 ** 3).toFixed(2), "GB");
  console.log("Free Memory:", (os.freemem() / 1024 ** 3).toFixed(2), "GB");

  // For heap memory usage → comes from process.memoryUsage()
  const memUsage = process.memoryUsage();
  console.log(
    "Heap Memory Used:",
    (memUsage.heapUsed / 1024 ** 2).toFixed(2),
    "MB"
  );
  console.log(
    "Heap Memory Total:",
    (memUsage.heapTotal / 1024 ** 2).toFixed(2),
    "MB"
  );

  console.log("Hostname:", os.hostname());
  console.log("OS Type:", os.type());
  console.log("OS Platform:", os.platform());
  console.log("OS Release:", os.release());
  console.log("Uptime:", (os.uptime() / 3600).toFixed(2), "hours");
}

module.exports = systemDetails;
