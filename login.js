const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const session = require("express-session");

const app = express();
app.use("/assets", express.static("assets"));
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root00",
    database: "club",
});

// Connect to the database
connection.connect(function (error) {
    if (error) {
        console.error("Error connecting to the database:", error.stack);
        return;
    }
    console.log("Connected to the database successfully!");
});

// Define a route to handle GET requests for the admin dashboard
app.get("/admin", function (req, res) {
    // Add admin-specific functionalities like member management, event management, reporting

    // Fetch data from the loginuser table
    connection.query("SELECT * FROM loginuser", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Render the admin.html page with the fetched data
        res.sendFile(__dirname + "/admin.html");

    });
});

// Add session middleware
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
}));


// Handle POST requests for login
app.post("/", encoder, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    connection.query(
        "SELECT * FROM loginuser WHERE user_name = ? AND user_pass = ?",
        [username, password],
        function (error, results, fields) {
            if (results.length > 0) {
                // Set session upon successful login
                req.session.user = {
                    username: results[0].user_name,
                    role: results[0].user_role,
                };

                // Redirect based on user role
                if (results[0].user_role === "admin") {
                    res.redirect("/admin");
                } else if (results[0].user_role === "member") {
                    res.redirect("/member");
                } else {
                    res.redirect("/");
                }
            } else {
                res.redirect("/");
            }
        }
    );
});
//--------------------------

// Handle GET requests for members' data
app.get("/admin/members", function (req, res) {
    connection.query("SELECT * FROM loginuser", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }

        // Respond with the fetched data in JSON format
        res.json(results);
    });
});

//-----------------------------
// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.user) {
        // User is authenticated, proceed to the next middleware or route
        return next();
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect("/");
    }
};

// Apply the middleware to routes that require authentication
app.use("/admin", authenticateUser);
app.use("/member", authenticateUser);


// Handle GET requests for the admin dashboard
app.get("/admin", function (req, res) {
    // Add admin-specific functionalities like member management, event management, reporting
    res.sendFile(__dirname + "/admin.html");
});

// Handle GET requests for the member area
app.get("/member", function (req, res) {
    // Add member-specific functionalities like viewing personal information, event listing
    res.sendFile(__dirname + "/member.html");
});

// Serve the login page for both GET and POST requests to "/"
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

// Set the app port
const PORT = 3600;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
