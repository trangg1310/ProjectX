// get the client
import mysql from 'mysql2/promise'

// create the connection to database

console.log("Creating connection pool...")
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'qlqa'
});



// with placeholder
/*
connection.query(
    'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
    ['Page', 45],
    function (err, results) {
        console.log(results);
    }
);
*/
export default pool;