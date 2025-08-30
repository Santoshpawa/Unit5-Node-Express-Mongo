const { hostname } = require("os");
const url = require("url");

function parseURL(path) {
  let parsed = url.parse(path, true);
  let obj = {
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    query: parsed.query,
  };
  return obj;
}

module.exports = parseURL;