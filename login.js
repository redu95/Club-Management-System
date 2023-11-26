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

app.post("/admin/add-user", encoder, function (req, res) {
    var newUserName = req.body.user_name;
    var newUserPassword = req.body.user_pass;
    var newUserRole = req.body.user_role;
    var newUserSex = req.body.user_sex; // New line

    console.log("User Sex:", newUserSex);

    // Add the new user to the loginuser table
    connection.query(
        "INSERT INTO loginuser (user_name, user_pass, user_role, user_sex) VALUES (?, ?, ?, ?)",
        [newUserName, newUserPassword, newUserRole, newUserSex], // New line
        function (error, results, fields) {
            if (error) {
                console.error("Error adding a new user:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            res.send("New user added successfully");
        }
    );
});



//========================================================================

//====================Deletion===========================================

// Handle DELETE requests for deleting a user
app.delete("/admin/delete-user/:userId", function (req, res) {
    const userId = req.params.userId;

    // Fetch user data based on the user ID
    connection.query("SELECT * FROM loginuser WHERE user_id = ?", [userId], function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Check if user data is found
        if (results.length > 0) {
            // Respond with a confirmation message and user data
            res.json({ confirmation: "Please confirm deletion", user: results[0] });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Handle the actual DELETE request for user deletion
app.delete("/admin/delete-user/:userId/confirm", function (req, res) {
    const userId = req.params.userId;

    // Delete the user from the loginuser table
    connection.query("DELETE FROM loginuser WHERE user_id = ?", [userId], function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Respond with a success message
        res.send("User deleted successfully");
        console.log("User deleted successfully");
    });
});


//========================================================================

//================== Edit member role================================

app.put("/admin/edit-user/:userId/:newRole", function (req, res) {
    const userId = req.params.userId;
    const newRole = req.params.newRole;

    // Update the user's role in the database
    connection.query(
        "UPDATE loginuser SET user_role = ? WHERE user_id = ?",
        [newRole, userId],
        function (error, results, fields) {
            if (error) {
                console.error("Error updating user role:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            res.send("User role updated successfully");
            console.log("User role updated successfully");
        }
    );
});


//========================================================================

// Handle GET requests for fetching events   FOR MEMBERS
app.get("/api/events3", function (req, res) {
    // Fetch events from the events table in descending order of event_id (assuming event_id is an auto-incrementing primary key)
    connection.query("SELECT * FROM events ORDER BY event_id DESC", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }
        // Update the image paths to include the correct URL prefix
        const eventsWithRelativePaths = results.map(event => {
            return {
                ...event,
                event_image: `/assets/images/${event.event_image}`
            };
        });

        res.json(eventsWithRelativePaths);
    });
});


//========================Event Things===================================

// Handle GET requests for fetching events
app.get("/api/events2", function (req, res) {
    // Fetch events from the events table in descending order of event_id (assuming event_id is an auto-incrementing primary key)
    connection.query("SELECT * FROM events ORDER BY event_id DESC", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }
        // Update the image paths to include the correct URL prefix
        const eventsWithRelativePaths = results.map(event => {
            return {
                ...event,
                event_image: `/assets/images/${event.event_image}`
            };
        });

        res.json(eventsWithRelativePaths);
    });
});


// Handle POST requests for creating events
app.post("/api/events", function (req, res) {
    const { event_title, event_image, event_description } = req.body;

    // Add the new event to the events table
    connection.query(
        "INSERT INTO events (event_title, event_image, event_description) VALUES (?, ?, ?)",
        [event_title, event_image, event_description],
        function (error, results, fields) {
            if (error) {
                console.error("Error adding a new event:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            res.send("New event added successfully");
        }
    );
});


//=======================================================================

//=====================Report Things===============================

// Handle GET requests for reports
app.get("/admin/reports", function (req, res) {
    // Fetch counts for different categories (sex, role, status)
    connection.query("SELECT user_sex, user_role, user_status, COUNT(*) as count FROM loginuser GROUP BY user_sex, user_role, user_status", function (error, results, fields) {
        if (error) {
            console.log("ERRor in database");
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Respond with the fetched data in JSON format
        res.json(results);
        console.log("Working")
    });
});



//================================================================

// Set the app port
const PORT = 3200;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});