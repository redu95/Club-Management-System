const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const session = require("express-session");
const cors = require("cors");
const app = express();
const fs = require('fs');
//const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Specify the upload directory

app.use("/assets", express.static("assets"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.json()); // Add this line to parse JSON data

// Add session middleware
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
}));

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
                    id: results[0].user_id,
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


//========================== Edit profile  ==================
// Handle POST requests for editing profile information

app.post("/api/editProfile", authenticateUser, function (req, res) {
    const userId = req.session.user && req.session.user.id;
    const newUsername = req.body.newUsername;
    const newUserSex = req.body.newUserSex;

    if (userId) {
        connection.query(
            "UPDATE loginuser SET user_name = ?, user_sex = ? WHERE user_id = ?",
            [newUsername, newUserSex, userId],
            function (error, results, fields) {
                if (error) {
                    console.error("Error updating profile information:", error);
                    res.status(500).send("Internal Server Error");
                    return;
                }

                // Respond with a success message
                res.send("Profile information updated successfully");
            }
        );
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});




//=====================================================================CHANGE++++++++=============================
// Handle POST requests for changing password
app.post('/api/changePassword', encoder, (req, res) => {
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


                // Log relevant information for debugging
                console.log('Old Password:', oldPassword);


                connection.query(
                    'UPDATE loginuser SET user_pass = ? WHERE user_id = ?',
                    [newPassword, userId],
                    (updateError, updateResults) => {
                        if (updateError) {
                            console.error('Password update error:', updateError);
                            res.status(500).send('Internal Server Error');
                        } else if (updateResults.affectedRows > 0) {
                            res.send('Password changed successfully');
                            console.log('Password changed successfully')
                            console.log(newPassword)
                        } else {
                            res.status(500).send('Failed to update password');
                            console.log('Failed to update password')
                        }
                    }
                );
            } else {
                res.status(404).send('User not found');
            }
        }
    );
});




//=================================================

// Handle POST requests for login
app.post("/", encoder, function (req, res) {
    req.session = req.session || {};
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

                console.log("Session user:", req.session.user); // Log the session user data

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

app.put("/admin/edit-user/:userId", function (req, res) {
    const userId = req.params.userId;
    const newRole = req.body.newRole;
    const newStatus = req.body.newStatus;

    // Update the user's role and status in the database
    connection.query(
        "UPDATE loginuser SET user_role = ?, user_status = ? WHERE user_id = ?",
        [newRole, newStatus, userId],
        function (error, results, fields) {
            if (error) {
                console.error("Error updating user role and status:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            res.send("User role and status updated successfully");
            console.log("User role and status updated successfully");
        }
    );
});




//========================================================================

// Handle GET requests for fetching events   FOR MEMBERS
app.get("/api/events3", function (req, res) {
    // Fetch events from the events table in descending order of event_id
    connection.query("SELECT * FROM events ORDER BY event_id DESC", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Update the image paths to include the correct URL prefix
        const eventsWithRelativePaths = results.map(event => {
            try {
                if (event.event_image && Buffer.isBuffer(event.event_image)) {
                    const base64Image = event.event_image.toString('base64');
                    return {
                        ...event,
                        event_image: base64Image,
                    };
                } else {
                    console.error('Invalid image data format:', event.event_id);
                    return {
                        ...event,
                        event_image: null, // or 'path/to/placeholder-image.jpg'
                    };
                }
            } catch (error) {
                console.error('Error converting image to base64:', error);
                return {
                    ...event,
                    event_image: null, // or 'path/to/placeholder-image.jpg'
                };
            }
        });

        res.json(eventsWithRelativePaths);
    });
});


//========================Event Things===================================

// Handle GET requests for fetching events
app.get("/api/events2", function (req, res) {
    // Fetch events from the events table in descending order of event_id
    connection.query("SELECT * FROM events ORDER BY event_id DESC", function (error, results, fields) {
        if (error) {
            console.error("Database query error:", error);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Update the image paths to include the correct URL prefix
        const eventsWithRelativePaths = results.map(event => {
            try {
                if (event.event_image && Buffer.isBuffer(event.event_image)) {
                    const base64Image = event.event_image.toString('base64');
                    return {
                        ...event,
                        event_image: base64Image,
                    };
                } else {
                    console.error('Invalid image data format:', event.event_id);
                    return {
                        ...event,
                        event_image: null, // or 'path/to/placeholder-image.jpg'
                    };
                }
            } catch (error) {
                console.error('Error converting image to base64:', error);
                return {
                    ...event,
                    event_image: null, // or 'path/to/placeholder-image.jpg'
                };
            }
        });

        res.json(eventsWithRelativePaths);
    });
});



// Handle POST requests for creating events
app.post("/api/events", upload.single('event_image'), function (req, res) {
    const { event_title, event_image, event_description } = req.body;
    console.log('Received image data:', event_image);
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageBuffer = req.file.buffer; // Use req.file to access the uploaded file


    // Add the new event to the events table
    connection.query(
        "INSERT INTO events (event_title, event_image, event_description) VALUES (?, ?, ?)",
        [event_title, imageBuffer, event_description],
        function (error, results, fields) {
            if (error) {
                console.error("Error adding a new event:", error);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Respond with a success message
            console.log("New event added successfully");
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
//========================MY PROFILE=============================

// Handle GET requests for the user's profile information
app.get("/api/profileInfo", authenticateUser, function (req, res) {
    console.log("Session user in /api/profileInfo:", req.session.user);
    const userId = req.session.user && req.session.user.id;
    console.log("User ID:", userId); // Log the user ID
    // Fetch user profile data based on the user ID
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

// Handle GET requests for the user's profile information
app.get("/api/profileInfo2", authenticateUser, function (req, res) {
    console.log("Session user in /api/profileInfo:", req.session.user);
    const userId = req.session.user && req.session.user.id;
    console.log("User ID:", userId); // Log the user ID
    // Fetch user profile data based on the user ID
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


//================================================================

// Set the app port
const PORT = 3300;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});