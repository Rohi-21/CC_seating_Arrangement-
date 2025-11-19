// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("./db"); // must export a `query` function that runs pg queries

const app = express();

// allow frontend local dev origin (adjust if your frontend runs on different origin)
// set to true for broad access in dev: app.use(cors());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123456";

// -------------------------
// Health
// -------------------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// -------------------------
// AUTH ROUTES
// -------------------------
// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // check existing user
    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

    const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Validate token (used by frontend to check session)
app.get("/api/auth/validate", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ valid: false });

    const token = auth.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ valid: false });
    }

    const userRes = await query("SELECT id, name, email FROM users WHERE id = $1", [payload.userId]);
    if (userRes.rows.length === 0) return res.status(401).json({ valid: false });

    res.json({ valid: true, user: userRes.rows[0] });
  } catch (err) {
    console.error("Validate error:", err);
    res.status(500).json({ valid: false });
  }
});

// -------------------------
// Dashboard stats
// -------------------------
app.get("/api/stats", async (req, res) => {
  try {
    const [students, rooms, exams, allocations] = await Promise.all([
      query("SELECT COUNT(*) FROM students"),
      query("SELECT COUNT(*) FROM rooms"),
      query("SELECT COUNT(*) FROM exams"),
      query("SELECT COUNT(*) FROM seat_allocations"),
    ]);
    res.json({
      totalStudents: Number(students.rows[0].count),
      totalRooms: Number(rooms.rows[0].count),
      totalExams: Number(exams.rows[0].count),
      totalAllocations: Number(allocations.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching stats" });
  }
});

// -------------------------
// Students
// -------------------------
app.get("/api/students", async (req, res) => {
  try {
    const result = await query("SELECT * FROM students ORDER BY roll_number ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching students" });
  }
});

app.post("/api/students", async (req, res) => {
  const { roll_number, name, department, semester, section, email } = req.body;
  if (!roll_number || !name || !department || !semester) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await query(
      `INSERT INTO students (roll_number, name, department, semester, section, email)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [roll_number, name, department, semester, section || null, email || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") return res.status(409).json({ error: "Roll number exists" });
    res.status(500).json({ error: "Error creating student" });
  }
});

// -------------------------
// Rooms
// -------------------------
app.get("/api/rooms", async (req, res) => {
  try {
    const result = await query("SELECT * FROM rooms ORDER BY room_number ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching rooms" });
  }
});

app.post("/api/rooms", async (req, res) => {
  const { room_number, building, floor, capacity, rows, columns } = req.body;
  if (!room_number || !capacity) return res.status(400).json({ error: "room_number and capacity required" });
  try {
    const result = await query(
      `INSERT INTO rooms (room_number, building, floor, capacity, rows, columns)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [room_number, building || null, floor || null, capacity, rows || null, columns || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") return res.status(409).json({ error: "Room number exists" });
    res.status(500).json({ error: "Error creating room" });
  }
});

// -------------------------
// Exams
// -------------------------
app.get("/api/exams", async (req, res) => {
  try {
    const result = await query("SELECT * FROM exams ORDER BY exam_date ASC, exam_time ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching exams" });
  }
});

app.get("/api/exams/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query("SELECT * FROM exams WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Exam not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching exam" });
  }
});

app.post("/api/exams", async (req, res) => {
  const { course_code, course_name, exam_date, exam_time, department, semester, duration_minutes } = req.body;
  if (!course_code || !course_name || !exam_date || !exam_time || !department || !semester || !duration_minutes) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await query(
      `INSERT INTO exams
        (course_code, course_name, exam_date, exam_time, department, semester, duration_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [course_code, course_name, exam_date, exam_time, department, semester, duration_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating exam" });
  }
});

// -------------------------
// Seating generation (server-side)
// -------------------------
app.post("/api/seating/generate", async (req, res) => {
  const { examId } = req.body;
  if (!examId) return res.status(400).json({ error: "examId is required" });

  try {
    const examRes = await query("SELECT * FROM exams WHERE id = $1", [examId]);
    if (examRes.rowCount === 0) return res.status(404).json({ error: "Exam not found" });
    const exam = examRes.rows[0];

    const studentsRes = await query(
      `SELECT * FROM students WHERE department = $1 AND semester = $2 ORDER BY roll_number ASC`,
      [exam.department, exam.semester]
    );
    const students = studentsRes.rows;
    if (students.length === 0) return res.status(400).json({ error: "No students found for this exam" });

    const roomsRes = await query("SELECT * FROM rooms ORDER BY room_number ASC");
    const rooms = roomsRes.rows;
    if (rooms.length === 0) return res.status(400).json({ error: "No rooms configured" });

    // delete existing allocations for exam
    await query("DELETE FROM seat_allocations WHERE exam_id = $1", [examId]);

    const allocations = [];
    let studentIndex = 0;

    for (const room of rooms) {
      if (studentIndex >= students.length) break;
      const capacity = Number(room.capacity) || 0;
      const rows = Number(room.rows) || 1;
      const cols = Number(room.columns) || capacity || 1;

      for (let seat = 1; seat <= capacity && studentIndex < students.length; seat++) {
        const student = students[studentIndex];
        const seatIndex = seat - 1;
        const seatRow = Math.floor(seatIndex / cols) + 1;
        const seatCol = (seatIndex % cols) + 1;

        allocations.push({
          exam_id: examId,
          student_id: student.id,
          room_id: room.id,
          seat_number: seat,
          seat_row: seatRow,
          seat_col: seatCol,
        });

        studentIndex++;
      }
    }

    if (studentIndex < students.length) {
      return res.status(400).json({
        error: "Not enough room capacity",
        allocated: studentIndex,
        total: students.length,
      });
    }

    if (allocations.length > 0) {
      const values = [];
      const placeholders = allocations.map((a, i) => {
        const offset = i * 6;
        values.push(a.exam_id, a.student_id, a.room_id, a.seat_number, a.seat_row, a.seat_col);
        return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6})`;
      });
      const sql = `INSERT INTO seat_allocations (exam_id, student_id, room_id, seat_number, seat_row, seat_col) VALUES ${placeholders.join(",")}`;
      await query(sql, values);
    }

    res.json({ message: "Seating generated", totalAllocated: allocations.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating seating" });
  }
});

// -------------------------
// Seating allocations REST endpoints (GET, POST, DELETE)
// -------------------------
app.get("/api/seating_allocations", async (req, res) => {
  try {
    const { exam_id, limit, include, order } = req.query;
    const includes = String(include || "").split(",").map((s) => s.trim()).filter(Boolean);

    // Base select fields
    let select = `sa.*`;
    let joins = ``;

    if (includes.includes("students")) {
      select += `, json_build_object(
        'id', s.id,
        'roll_number', s.roll_number,
        'name', s.name,
        'department', s.department
      ) as students`;
      joins += ` LEFT JOIN students s ON s.id = sa.student_id`;
    }

    if (includes.includes("rooms")) {
      select += `, json_build_object(
        'id', r.id,
        'room_number', r.room_number,
        'building', r.building,
        'capacity', r.capacity,
        'rows', r.rows,
        'columns', r.columns
      ) as rooms`;
      joins += ` LEFT JOIN rooms r ON r.id = sa.room_id`;
    }

    let sql = `SELECT ${select} FROM seat_allocations sa ${joins}`;
    const params = [];
    if (exam_id) {
      params.push(exam_id);
      sql += ` WHERE sa.exam_id = $${params.length}`;
    }
    if (order) {
      sql += ` ORDER BY ${String(order)}`;
    } else {
      sql += ` ORDER BY sa.room_id, sa.seat_number`;
    }
    if (limit) {
      sql += ` LIMIT ${Number(limit)}`;
    }

    const result = await query(sql, params);
    const rows = result.rows.map((r) => {
      const out = { ...r };
      if (out.students && typeof out.students === "string") {
        try { out.students = JSON.parse(out.students); } catch(e) {}
      }
      if (out.rooms && typeof out.rooms === "string") {
        try { out.rooms = JSON.parse(out.rooms); } catch(e) {}
      }
      return out;
    });

    res.json(rows);
  } catch (err) {
    console.error("GET /api/seating_allocations error:", err);
    res.status(500).json({ error: "Error fetching seating allocations" });
  }
});

app.post("/api/seating_allocations", async (req, res) => {
  try {
    const { allocations } = req.body;
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: "allocations array required" });
    }

    for (const a of allocations) {
      if (typeof a.exam_id === "undefined" || typeof a.student_id === "undefined" || typeof a.room_id === "undefined" || typeof a.seat_number === "undefined") {
        return res.status(400).json({ error: "each allocation must include exam_id, student_id, room_id, seat_number" });
      }
    }

    const values = [];
    const placeholders = allocations.map((a, i) => {
      const offset = i * 6;
      values.push(a.exam_id, a.student_id, a.room_id, a.seat_number, a.seat_row ?? null, a.seat_col ?? null);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    });

    const sql = `
      INSERT INTO seat_allocations (exam_id, student_id, room_id, seat_number, seat_row, seat_col)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;

    const result = await query(sql, values);
    res.status(201).json({ inserted: result.rowCount, rows: result.rows });
  } catch (err) {
    console.error("POST /api/seating_allocations error:", err);
    res.status(500).json({ error: "Error saving seating allocations" });
  }
});

app.delete("/api/seating_allocations", async (req, res) => {
  try {
    const { exam_id } = req.query;
    if (!exam_id) return res.status(400).json({ error: "exam_id query required" });

    const result = await query("DELETE FROM seat_allocations WHERE exam_id = $1", [exam_id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error("DELETE /api/seating_allocations error:", err);
    res.status(500).json({ error: "Error deleting seating allocations" });
  }
});

// -------------------------
// Reports
// -------------------------
app.get("/api/reports/room-wise", async (req, res) => {
  const examId = req.query.examId;
  if (!examId) return res.status(400).json({ error: "examId required" });

  try {
    const result = await query(
      `SELECT r.room_number, sa.seat_number, sa.seat_row, sa.seat_col, s.roll_number, s.name
       FROM seat_allocations sa
       JOIN rooms r ON sa.room_id = r.id
       JOIN students s ON sa.student_id = s.id
       WHERE sa.exam_id = $1
       ORDER BY r.room_number, sa.seat_number`,
      [examId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching room-wise report" });
  }
});

app.get("/api/reports/student-wise", async (req, res) => {
  const examId = req.query.examId;
  if (!examId) return res.status(400).json({ error: "examId required" });

  try {
    const result = await query(
      `SELECT s.roll_number, s.name, r.room_number, sa.seat_number, sa.seat_row, sa.seat_col
       FROM seat_allocations sa
       JOIN students s ON sa.student_id = s.id
       JOIN rooms r ON sa.room_id = r.id
       WHERE sa.exam_id = $1
       ORDER BY s.roll_number`,
      [examId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching student-wise report" });
  }
});

// -------------------------
// Start server
// -------------------------
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on port ${port}`));
