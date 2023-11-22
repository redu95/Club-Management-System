var mysql = require("mysql2")

var con = mysql.createConnection({
    host: "localhost",
    user: "Rediet",
    password: "redu"
});
con.connect(function(err){
    if(err) throw err;
    console.log("Working")
});