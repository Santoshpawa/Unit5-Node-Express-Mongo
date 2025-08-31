const timers = require("timers");

function delayFunction(obj) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: obj.message,
        delay: obj.time + "ms",
      });
      console.log(resolve);
    }, Number(obj.time));
  });
}
module.exports = delayFunction;
