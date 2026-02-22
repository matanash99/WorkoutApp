const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Updated array using 'muscle' instead of 'difficulty'
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
    // 1. Destroy the old table
    db.run("DROP TABLE IF EXISTS Exercises");
    
    // 2. Build the new table with the 'muscle' column
    db.run(`CREATE TABLE Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        muscle TEXT,
        media_url TEXT
    )`);
    
    // 3. Prepare the inserter
    const stmt = db.prepare("INSERT INTO Exercises (name, muscle, media_url) VALUES (?, ?, ?)");
    
    // 4. Loop through our list and save them all
    drills.forEach(drill => {
        stmt.run(drill.name, drill.muscle, drill.media_url);
    });
    
    stmt.finalize();
    console.log("✅ Database table recreated and seeded with the new 'muscle' column!");
});

db.close();