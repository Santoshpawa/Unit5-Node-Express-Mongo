const path = require("path");

function filePath(filepath) {
  let parsed = path.parse(filepath);
  return {
    dir: parsed.dir,
    base: parsed.base,
    ext: parsed.ext,
    name: parsed.name,
  };
}

module.exports = filePath;
