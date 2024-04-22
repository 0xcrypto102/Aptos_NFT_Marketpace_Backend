
const mysql = require('mysql');

// Create a connection to the  MySQL database
const con1 = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});


export default con1;