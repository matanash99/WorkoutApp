const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// --- NEW: HOST THE FRONTEND APP ---
// This tells Node.js to serve our HTML, CSS, and JS directly
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to the SQLite database.');
});

// ROUTE 1: Get the list of drills
app.get('/api/exercises', (req, res) => {
    db.all("SELECT * FROM Exercises", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// ROUTE 2: Start a new workout session
app.post('/api/workouts/start', (req, res) => {
    // Hardcoding user 1 for now
    const sql = `INSERT INTO Logged_Workouts (user_id) VALUES (1)`;
    db.run(sql, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Workout started", workoutId: this.lastID });
    });
});

// ROUTE 3: Log the sets
app.post('/api/logs/set', (req, res) => {
    const { logged_workout_id, exercise_id, weight, reps, sets } = req.body;
    
    const stmt = db.prepare(`INSERT INTO Logged_Sets (logged_workout_id, exercise_id, weight, reps, set_number) VALUES (?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= sets; i++) {
        stmt.run(logged_workout_id, exercise_id, weight, reps, i);
    }
    
    stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `${sets} sets logged successfully!` });
    });
});

// ROUTE 4: Finish the workout session
app.put('/api/workouts/finish/:id', (req, res) => {
    const workoutId = req.params.id;
    const sql = `UPDATE Logged_Workouts SET end_time = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [workoutId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Workout finished!" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running! API is live at http://localhost:${PORT}`);
});