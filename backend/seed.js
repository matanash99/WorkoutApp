const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const drills = [
    { name: "סקוואט אחורי (Back Squat)", muscle: "רגליים", media_url: "assets/back_squat.gif" },
    { name: "סקוואט קדמי (Front Squat)", muscle: "רגליים", media_url: "assets/front_squat.gif" },
    { name: "דדליפט (Deadlift)", muscle: "גב/רגליים", media_url: "assets/deadlift.gif" },
    { name: "לחיצת חזה (Bench Press)", muscle: "חזה", media_url: "assets/bench_press.gif" },
    { name: "קלין (Clean)", muscle: "רגליים/גב", media_url: "assets/clean.gif" },
    { name: "קלין גבוה (High Clean)", muscle: "רגליים/גב", media_url: "assets/high_clean.gif" },
    { name: "הרמת אגן (Hip Raise)", muscle: "בטן", media_url: "assets/hip_raise.gif" },
    { name: "לאנג' (Lunge)", muscle: "רגליים", media_url: "assets/lunge.gif" },
    { name: "סטפ אפ (Step Up)", muscle: "רגליים", media_url: "assets/step_up.gif" },
    { name: "אמריקן (American Swing)", muscle: "כתפיים/גב", media_url: "assets/american.gif" }
];

db.serialize(() => {
    // 1. Rebuild Exercises table with the correct 'muscle' and 'media_url' columns
    db.run("DROP TABLE IF EXISTS Exercises");
    db.run(`CREATE TABLE Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        muscle TEXT,
        media_url TEXT
    )`);
    
    // 2. Ensure Workouts and Sets tables exist so the app never crashes
    // FIXED: changed user_id to TEXT to support your custom Trainee IDs
    db.run(`CREATE TABLE IF NOT EXISTS Logged_Workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Logged_Sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        logged_workout_id INTEGER,
        exercise_id INTEGER,
        weight REAL,
        reps INTEGER,
        set_number INTEGER,
        FOREIGN KEY(logged_workout_id) REFERENCES Logged_Workouts(id),
        FOREIGN KEY(exercise_id) REFERENCES Exercises(id)
    )`);

    // 3. Seed the drills
    const stmt = db.prepare("INSERT INTO Exercises (name, muscle, media_url) VALUES (?, ?, ?)");
    drills.forEach(drill => {
        stmt.run(drill.name, drill.muscle, drill.media_url);
    });
    stmt.finalize();
    
    console.log("✅ Database completely restored and re-seeded!");
});

db.close();