const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO Exercises (name, target_muscle, difficulty, media_url) VALUES (?, ?, ?, ?)");
    
    // Inserting our dummy exercises
    stmt.run('Lunge Press', 'Legs/Shoulders', 'Intermediate', '/assets/animations/lunge-press.gif');
    stmt.run('Bench Press', 'Chest', 'Intermediate', '/assets/animations/bench-press.gif');
    stmt.run('Squat', 'Legs', 'Hard', '/assets/animations/squat.gif');
    
    stmt.finalize(() => {
        console.log("Dummy data successfully inserted!");
    });
});

// Close the database safely after the operations finish
db.close();