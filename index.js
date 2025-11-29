
const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");
const port = process.env.PORT || 8080;

require("dotenv").config();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// DB connection (callback mode)
// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "MOHaadil2501mysql",
//   database: "student_system"
// });

//for deployment
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});


// HOME LOGIN PAGE
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

// LOGIN ROUTE
app.post("/login", (req, res) => {
  const { user, password, role } = req.body;

  db.query(
    "SELECT * FROM users WHERE (rollNo=? OR email=?) AND password=?",
    [user, user, password],
    (err, results) => {
      if (err) return res.send("Database error: " + err);

      if (results.length === 0)
        return res.render("login", { error: "Invalid credentials" });

      const found = results[0];

      if (found.role !== role)
        return res.render("login", { error: "Role mismatch" });

      if (role === "admin") {
        db.query("SELECT * FROM users WHERE role='student'", (err2, students) => {
          if (err2) return res.send(err2);
          return res.render("admin", { students });
        });
      } else {
        db.query(
          "SELECT * FROM results WHERE student_id=?",
          [found.id],
          (err3, resultRows) => {
            if (err3) return res.send(err3);

            found.results = resultRows;
            return res.render("student", { student: found });
          }
        );
      }
    }
  );
});

// ADMIN DASHBOARD
app.get("/admin", (req, res) => {
  db.query("SELECT * FROM users WHERE role='student'", (err, students) => {
    if (err) return res.send(err);
    res.render("admin", { students });
  });
});

// ADD STUDENT
app.post("/add-student", (req, res) => {
  const { id, name, rollNo, email, password, course, semester, department, gpa, photo } = req.body;

  db.query(
    `INSERT INTO users (id, name, rollNo, email, password, course, semester, department, gpa, role, photo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
    [id, name, rollNo, email, password, course, semester, department, gpa, photo],
    (err) => {
      if (err) return res.send(err);
      res.redirect("/admin");
    }
  );
});

// EDIT STUDENT PAGE
app.get("/edit-student/:id", (req, res) => {
  db.query("SELECT * FROM users WHERE id=?", [req.params.id], (err, rows) => {
    if (err) return res.send(err);

    if (rows.length === 0) return res.send("Student not found");

    res.render("edit-student", { student: rows[0] });
  });
});

// UPDATE STUDENT
app.post("/edit-student/:id", (req, res) => {
  const { id, name, rollNo, email, password, course, semester, department, gpa, photo, role } = req.body;

  db.query(
    `UPDATE users SET id=?, name=?, rollNo=?, email=?, password=?, course=?, semester=?, department=?, gpa=?, photo=?, role=? WHERE id=?`,
    [id, name, rollNo, email, password, course, semester, department, gpa, photo, role, req.params.id],
    (err) => {
      if (err) return res.send(err);

      res.redirect("/admin");
    }
  );
});

// REPORT PAGE
app.get("/report/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM users WHERE id=?", [id], (err, userRows) => {
    if (err) return res.send(err);

    if (userRows.length === 0) return res.send("Student not found");

    const student = userRows[0];

    db.query("SELECT * FROM results WHERE student_id=?", [id], (err2, results) => {
      if (err2) return res.send(err2);

      student.results = results;

      res.render("report", { student });
    });
  });
});

// SERVER START
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
