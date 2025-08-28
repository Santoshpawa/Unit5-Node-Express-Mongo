function isPrime(a) {
  if (a == 1) {
    console.log(`${a} is neither prime nor composite`);
    return;
  }
  if (a < 1) {
    console.log("Number should be a positive integer!!!");
    return;
  }
  if (a == 2 || a == 3) {
    console.log(`${a} is a Prime Number`);
    return;
  }
  let check = true;
  for (let i = 2; i * i <= a; ++i) {
    if (a % i == 0) {
      check = false;
      break;
    }
  }
  if (check) {
    console.log(`${a} is a Prime Number`);
  } else {
    console.log(`${a} is not a Prime Number`);
  }
}

module.exports = isPrime;
