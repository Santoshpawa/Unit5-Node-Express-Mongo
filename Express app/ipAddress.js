const ip = require("ip");

function getIP() {
  return ip.address();
}

module.exports = getIP;
