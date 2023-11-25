const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const session = require("express-session");
const cors = require("cors");
const app = express();
const bcrypt = require('bcrypt');

app.use("/assets", express.static("assets"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.json()); // Add this line to parse JSON data

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

// Handle GET requests for the member area
app.get("/member", function (req, res) {
    // Fetch user data based on the session information
    const userId = req.session.user && req.session.user.id;

    if (userId) {
        connection.query("SELECT * FROM loginuser WHERE user_id = ?", [userId], function (error, results, fields) {
            if (error) {
                console.error("Database query error:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Check if user data is found
            if (results.length > 0) {
                // Return the user data as JSON
                res.json(results[0]);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});


//==========================   ==================


// Handle POST requests for changing password
app.post('/change-password', encoder, (req, res) => {
    const userId = req.session.user.id; // Retrieve user ID from the session
    const { oldPassword, newPassword } = req.body;

    // Fetch the user's current hashed password from the database
    connection.query(
        'SELECT user_pass FROM loginuser WHERE user_id = ?',
        [userId],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (results.length > 0) {
                const storedHashedPassword = results[0].user_pass;

                // Verify the old password against the stored hashed password
                if (bcrypt.compareSync(oldPassword, storedHashedPassword)) {
                    // Old password is correct, proceed with the update
                    connection.query(
                        'UPDATE loginuser SET user_pass = ? WHERE user_id = ?',
                        [bcrypt.hashSync(newPassword, 10), userId],
                        (updateError, updateResults) => {
                            if (updateError) {
                                console.error('Password update error:', updateError);
                                res.status(500).send('Internal Server Error');
                            } else if (updateResults.affectedRows > 0) {
                                res.send('Password changed successfully');
                                console.log('Password changed successfully')
                            } else {
                                res.status(500).send('Failed to update password');
                                console.log('Failed to update password')
                            }
                        }
                    );
                } else {
                    // Old password is incorrect
                    res.status(401).send('Old password is incorrect');
                    console.log('Old password is incorrect')
                }
            } else {
                // User not found
                res.status(404).send('User not found');
            }
        }
    );
});




//=================================================

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
                    id: results[0].user_id,  // Store user ID in the session
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


//===================================================================
app.use(express.urlencoded({ extended: true })); // Add this line to parse form data

//===========================Add memeber for Admin side==================

// Handle POST requests for adding a new user
app.post("/admin/add-user", encoder, function (req, res) {
    console.log("Request Body:", req.body);

    var newUserName = req.body.user_name;
    var newUserPassword = req.body.user_pass;
    var newUserRole = req.body.user_role;

    // Add the new user to the loginuser table
    connection.query(
        "INSERT INTO loginuser (user_name, user_pass, user_role) VALUES (?, ?, ?)",
        [newUserName, newUserPassword, newUserRole],
        function (error, results, fields) {
            if (error) {
                console.error("Error adding a new user:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            res.send("New user added successfully");
            console.log("New user added successfully");
        }
    );
});


//========================================================================


// Set the app port
const PORT = 3200;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});