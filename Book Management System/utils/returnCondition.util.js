function returnCondition(date1, date2) {
  // provide date is string format " ****-**-** year-month-day"

  const d1 = new Date(date1); //convert date into milliseconds from a particular date in past
  const d2 = new Date(date2);

  // diffrence in milliseconds
  const diffms = d1 - d2;

  const diffDays = diffms / (1000 * 60 * 60 * 24);

  return diffDays;
}

module.exports = returnCondition;
