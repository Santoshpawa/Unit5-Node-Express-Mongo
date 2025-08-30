const os = require("os");

function systemDetails() {
  let data = os.cpus();

  let obj = {
    architecture: os.arch(),
    cpu_cores: data.length,
    cpu_model: data[0].model,
    cpu_speed: data[0].speed + "MHz",
  };
  return obj;
}

module.exports = systemDetails;
