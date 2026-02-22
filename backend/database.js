const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database (this will create the file if it doesn't exist)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// db.serialize ensures queries run one after another, not all at once
db.serialize(() => {
    
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL
    )`);

    // 2. Exercises Table (תרגילים)
    db.run(`CREATE TABLE IF NOT EXISTS Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_muscle TEXT,
        difficulty TEXT,
        media_url TEXT
    )`);

    // 3. Workout_Templates Table (אימון מראש)
    db.run(`CREATE TABLE IF NOT EXISTS Workout_Templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )`);

    // 4. Template_Exercises Table (Links drills to templates)
    db.run(`CREATE TABLE IF NOT EXISTS Template_Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER,
        exercise_id INTEGER,
        exercise_order INTEGER,
        FOREIGN KEY (template_id) REFERENCES Workout_Templates(id),
        FOREIGN KEY (exercise_id) REFERENCES Exercises(id)
    )`);

    // 5. Logged_Workouts Table (אימונים שלי)
    db.run(`CREATE TABLE IF NOT EXISTS Logged_Workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        template_id INTEGER,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (template_id) REFERENCES Workout_Templates(id)
    )`);

    // 6. Logged_Sets Table (Current Training / Submit)
    db.run(`CREATE TABLE IF NOT EXISTS Logged_Sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        logged_workout_id INTEGER,
        exercise_id INTEGER,
        weight REAL,
        reps INTEGER,
        set_number INTEGER,
        FOREIGN KEY (logged_workout_id) REFERENCES Logged_Workouts(id),
        FOREIGN KEY (exercise_id) REFERENCES Exercises(id)
    )`);

    console.log('All tables created successfully.');

    // Inject dummy exercises if the table is empty
    db.get("SELECT COUNT(*) AS count FROM Exercises", (err, row) => {
        if (row.count === 0) {
            const insertExercise = db.prepare(`INSERT INTO Exercises (name, target_muscle, difficulty, media_url) VALUES (?, ?, ?, ?)`);
            insertExercise.run('Lunge Press', 'Legs/Shoulders', 'Intermediate', '/assets/animations/lunge-press.gif');
            insertExercise.run('Bench Press', 'Chest', 'Intermediate', '/assets/animations/bench-press.gif');
            insertExercise.run('Squat', 'Legs', 'Hard', '/assets/animations/squat.gif');
            insertExercise.finalize();
            console.log('Inserted dummy exercises.');
        }
    });
});

// Close the connection once everything is built
db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Database setup complete. Connection closed.');
    }
});