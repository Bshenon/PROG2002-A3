const mysql = require("mysql2/promise");
const details = require("./db-details");
module.exports = mysql.createPool({
  ...details,
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true,
});
