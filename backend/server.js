const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Host the frontend app
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
    const { userId } = req.body; // Grab the Trainee ID from the app
    
    // Save the specific ID to the database
    const sql = `INSERT INTO Logged_Workouts (user_id) VALUES (?)`;
    db.run(sql, [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Workout started", workoutId: this.lastID });
    });
});

// ROUTE 3: Log a drill (Single entry with weight, reps, sets)
app.post('/api/logs/set', (req, res) => {
    const { logged_workout_id, exercise_id, weight, reps, sets } = req.body;
    const sql = `INSERT INTO Logged_Sets (logged_workout_id, exercise_id, weight, reps, set_number) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [logged_workout_id, exercise_id, weight, reps, sets], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Drill logged successfully!" });
    });
});

// ROUTE 4: Get all logged drills for the active session (Joined with Exercises for the name)
app.get('/api/logs/:workoutId', (req, res) => {
    const sql = `
        SELECT s.id, s.weight, s.reps, s.set_number AS sets, e.name 
        FROM Logged_Sets s
        JOIN Exercises e ON s.exercise_id = e.id
        WHERE s.logged_workout_id = ?
        ORDER BY s.id ASC
    `;
    db.all(sql, [req.params.workoutId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// ROUTE 5: Delete a logged drill
app.delete('/api/logs/set/:id', (req, res) => {
    db.run(`DELETE FROM Logged_Sets WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "deleted" });
    });
});

// ROUTE 6: Update a logged drill
app.put('/api/logs/set/:id', (req, res) => {
    const { weight, reps, sets } = req.body;
    const sql = `UPDATE Logged_Sets SET weight = ?, reps = ?, set_number = ? WHERE id = ?`;
    db.run(sql, [weight, reps, sets, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "updated" });
    });
});

// ROUTE 7: Finish the workout session
app.put('/api/workouts/finish/:id', (req, res) => {
    const workoutId = req.params.id;
    const sql = `UPDATE Logged_Workouts SET end_time = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [workoutId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Workout finished!" });
    });
});

// ROUTE 8: Get workout history for a specific user
app.get('/api/workouts/history/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Fetch only the rows that match this specific user
    const sql = `
        SELECT 
            w.id, 
            w.start_time, 
            w.end_time, 
            COUNT(s.id) AS total_drills 
        FROM Logged_Workouts w
        LEFT JOIN Logged_Sets s ON w.id = s.logged_workout_id
        WHERE w.end_time IS NOT NULL AND w.user_id = ?
        GROUP BY w.id
        ORDER BY w.start_time DESC
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// ROUTE 9: Delete an entire workout session
app.delete('/api/workouts/:id', (req, res) => {
    const workoutId = req.params.id;
    
    // First, delete all sets attached to this workout so we don't leave orphaned data
    db.run(`DELETE FROM Logged_Sets WHERE logged_workout_id = ?`, [workoutId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Next, delete the actual workout record
        db.run(`DELETE FROM Logged_Workouts WHERE id = ?`, [workoutId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Workout deleted successfully" });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running! API is live at http://localhost:${PORT}`);
});