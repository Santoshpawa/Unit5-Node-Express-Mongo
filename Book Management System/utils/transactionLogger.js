const fs = require("fs");

function bookTransactions(data) {
  let transactions = JSON.parse(
    fs.readFileSync("./transactionLog.json", "utf8")
  );
  transactions.push(data);
  fs.writeFileSync("./transactionLog.json", JSON.stringify(transactions));
}

module.exports = bookTransactions;
