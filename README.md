# Club Management System

## Description
Club Management System for CSEC ASTU Club. This system, built with Node.js, Express.js, and MySQL, includes credential-based login for both Admins and Members. Admins have the ability to add, delete, and edit member data, as well as upload event posts. Members can view posts and edit their own profile data.

## Installation
- Prerequisites: Node.js, MySQL
- Install dependencies:
  ```bash
  npm install mysql express body-parser encoder session app cors upload
## Configuration
Configure MySQL database:
    Create a database named 'club'.
    Use the provided schema files for table creation:
            club.mwb for the overall schema.
            login.sql for the 'loginuser' table.
            events.sql for the 'events' table.
## Usage
Run the application using the command:
      npm app.js
## Database Schema
Database Name: 'club'
  Tables:
    'loginuser' (Refer to login.sql)
    'events' (Refer to events.sql)
