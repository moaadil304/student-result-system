const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 8080;
app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname,"views"));
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.render('login', { error: null });
});
const fs = require("fs");

app.post("/login", (req, res) => {
  const { user, password, role } = req.body;  // from form

  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading data file");
    }

    const students = JSON.parse(data);

    // match roll/email and password
    const found = students.find(
      s => (s.rollNo === user || s.email === user) && s.password === password
    );

    if (found) {
      if (role === "admin" && found.role === "admin") {
        console.log("Admin login successful!");
        res.render("admin", { students });
      } else if (role === "student" && found.role === "student") {
        console.log(" Student login successful!");
        res.render("student", { student: found });
      } else {
        console.log("⚠️ Role mismatch!");
        res.render("login", { error: "Invalid role selected" });
      }
    } else {
      console.log(" Invalid credentials!");
      res.render("login", { error: "Invalid Roll No / Email or Password" });
    }
  });

});

// ADD NEW STUDENT ROUTE
app.post("/add-student", (req, res) => {
  const newStudent = {
    id: req.body.id,
    name: req.body.name,
    rollNo: req.body.rollNo,
    email: req.body.email,
    password: req.body.password,
    course: req.body.course,
    semester: req.body.semester || "N/A",
    department: req.body.department || "N/A",
    gpa: parseFloat(req.body.gpa) || 0,
    role: "student",
    photo: req.body.photo || "/images/student.jpg",
    results: []
  };

  // Read existing data
  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const students = JSON.parse(data);
    students.push(newStudent); // add new record

    // Write back to file
    fs.writeFile("./data/students.json", JSON.stringify(students, null, 2), err => {
      if (err) return res.status(500).send("Error saving data");
      console.log("✅ New student added:", newStudent.name);
      res.render("admin", { students }); // refresh dashboard
    });
  });
});

// ADMIN DASHBOARD ROUTE
app.get("/admin", (req, res) => {
  const fs = require("fs");
  const success = req.query.success || null;
  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error loading admin data");
    }
    let allUsers = JSON.parse(data);
    const students = allUsers.filter(u => u.role === "student");
    const admins = allUsers.filter(u => u.role === "admin");

    res.render("admin", { students, success });
  });
});


// SHOW EDIT PAGE
app.get("/edit-student/:id", (req, res) => {
  const id = req.params.id;
  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const students = JSON.parse(data);
    const student = students.find(s => s.id === id);

    if (!student) return res.status(404).send("Student not found");
    res.render("edit-student", { student });
  });
});

// HANDLE UPDATE
app.post("/edit-student/:id", (req, res) => {
  const id = req.params.id;

  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    let students = JSON.parse(data);
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).send("Student not found");

    // Preserve old results
    const updatedStudent = {
      ...students[index],
      id: req.body.id,
      name: req.body.name,
      rollNo: req.body.rollNo,
      email: req.body.email,
      password: req.body.password,
      course: req.body.course,
      semester: req.body.semester || "N/A",
      department: req.body.department || "N/A",
      gpa: parseFloat(req.body.gpa) || 0,
      role: req.body.role,
      photo: req.body.photo || "/images/student.jpg"
    };

    students[index] = updatedStudent;

    fs.writeFile("./data/students.json", JSON.stringify(students, null, 2), err => {
      if (err) return res.status(500).send("Error saving data");
      console.log(`✅ Student updated: ${updatedStudent.name}`);
      res.redirect("/admin");
    });
  });
});


// VIEW REPORT (Admin)
app.get("/report/:id", (req, res) => {
  const id = req.params.id;
  fs.readFile("./data/students.json", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const students = JSON.parse(data);
    const student = students.find(s => s.id === id);

    if (!student) return res.status(404).send("Student not found");

    res.render("report", { student });
  });
});


app.listen(port , () =>{
    console.log(`listening on port ${port}`);
});
