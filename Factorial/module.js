function factorial(a) {
  if (a < 0) {
    console.log("Enter a positive number.");
    return;
  }
  if (a == 0 || a == 1) {
    console.log(`${a}! is : 1`);
    return;
  }
  let fact = 1;
  for (let i = 1; i <= a; ++i) {
    fact *= i;
  }
  console.log(`${a}! is: ${fact}`);
}

module.exports = factorial;
