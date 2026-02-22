const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const drills = [
    { name: "סקוואט (Squat)", muscle: "רגליים", media_url: "" },
    { name: "לחיצת חזה (Bench Press)", muscle: "חזה", media_url: "" },
    { name: "דדליפט (Deadlift)", muscle: "גב/רגליים", media_url: "" },
    { name: "מתח (Pull-ups)", muscle: "גב", media_url: "" },
    { name: "לחיצת כתפיים (Overhead Press)", muscle: "כתפיים", media_url: "" },
    { name: "חתירה במוט (Barbell Row)", muscle: "גב", media_url: "" },
    { name: "כפיפת מרפקים (Biceps Curl)", muscle: "ידיים", media_url: "" },
    { name: "פשיטת מרפקים (Triceps Ext)", muscle: "ידיים", media_url: "" },
    { name: "לאנג'ים (Lunges)", muscle: "רגליים", media_url: "" },
    { name: "כפיפות בטן (Crunches)", muscle: "בטן", media_url: "" }
];

db.serialize(() => {
    // 1. Rebuild Exercises table with the correct 'muscle' column
    db.run("DROP TABLE IF EXISTS Exercises");
    db.run(`CREATE TABLE Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        muscle TEXT,
        media_url TEXT
    )`);
    
    // 2. Ensure Workouts and Sets tables exist so the app never crashes
    db.run(`CREATE TABLE IF NOT EXISTS Logged_Workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
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