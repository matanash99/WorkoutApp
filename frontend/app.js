// --- API CONFIG & STATE ---
const API_BASE = 'http://localhost:3000/api';
let currentWorkoutId = null; 
let currentDrillId = null;   
let currentUserId = null; // Tracks who is currently using the app

let activeHistoryWorkoutId = null; 
let activeHistoryDate = null;

// --- DOM Elements ---
const menuBtn = document.getElementById('menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const sideMenu = document.getElementById('side-menu');
const navDrills = document.getElementById('nav-drills');
const navHistory = document.getElementById('nav-history');

const viewExercises = document.getElementById('view-exercises');
const viewTraining = document.getElementById('view-training');
const viewHistory = document.getElementById('view-history');
const viewWorkoutDetails = document.getElementById('view-workout-details');

const exerciseList = document.getElementById('exercise-list');
const historyList = document.getElementById('history-list');
const detailsList = document.getElementById('details-list');

const currentSetsContainer = document.getElementById('current-sets-container');
const currentSetsList = document.getElementById('current-sets-list');

const currentDrillName = document.getElementById('current-drill-name');
const drillAnimation = document.getElementById('drill-animation');
const pageTitle = document.querySelector('.page-title');
const detailsTitle = document.getElementById('details-title');

const logForm = document.getElementById('log-form');
const weightInput = document.getElementById('weight-input');
const repsInput = document.getElementById('reps-input');
const setsInput = document.getElementById('sets-input');

const backListBtn = document.getElementById('back-list-btn');
const finishBtnMain = document.getElementById('finish-btn-main');
const finishBtnDrill = document.getElementById('finish-btn-drill');
const backHistoryBtn = document.getElementById('back-history-btn');
const deleteWorkoutBtn = document.getElementById('delete-workout-btn');

const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInputs = document.getElementById('modal-inputs');

// --- CUSTOM MODAL ENGINE ---
function openModal(title, message, type = 'alert', inputs = []) {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalMessage.style.display = message ? 'block' : 'none';
        
        modalInputs.innerHTML = '';
        // CHANGED: Accept both standard 'prompt' and our new 'mandatory' mode
        if (type === 'prompt' || type === 'mandatory') {
            modalInputs.style.display = 'flex';
            inputs.forEach(inp => {
                const inputType = inp.type === 'text' ? 'text' : 'number';
                const minAttr = inp.id === 'weight' ? '0' : '1';
                const extraHtml = inputType === 'number' ? `min="${minAttr}" step="0.5"` : '';

                modalInputs.innerHTML += `
                    <div class="input-group">
                        <label>${inp.label}</label>
                        <input type="${inputType}" id="modal-inp-${inp.id}" class="num-input" value="${inp.value}" ${extraHtml} required>
                    </div>
                `;
            });
        } else {
            modalInputs.style.display = 'none';
        }

        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirmBtn);
        cancelBtn.replaceWith(newCancelBtn);

        // CHANGED: Hide cancel button if it is a mandatory login!
        if (type === 'alert') {
            newCancelBtn.style.display = 'none';
            newConfirmBtn.textContent = 'סגור';
        } else if (type === 'mandatory') {
            newCancelBtn.style.display = 'none';
            newConfirmBtn.textContent = 'היכנס'; // "Enter"
        } else {
            newCancelBtn.style.display = 'block';
            newConfirmBtn.textContent = 'אישור';
        }

        customModal.classList.remove('hidden-view');

        const closeModal = () => customModal.classList.add('hidden-view');

        newConfirmBtn.addEventListener('click', () => {
            let result = true;
            
            // CHANGED: Run validation for 'mandatory' mode too
            if (type === 'prompt' || type === 'mandatory') {
                result = {};
                let isValid = true; 
                
                inputs.forEach(inp => {
                    const inputEl = document.getElementById(`modal-inp-${inp.id}`);
                    const val = inputEl.value.trim(); 
                    
                    if (inp.type === 'text') {
                        if (val === '') {
                            isValid = false;
                            inputEl.style.border = "2px solid red";
                        } else {
                            inputEl.style.border = "1px solid #ccc";
                            result[inp.id] = val;
                        }
                    } else {
                        const numVal = parseFloat(val);
                        const minLimit = inp.id === 'weight' ? 0 : 1;
                        if (val === '' || isNaN(numVal) || numVal < minLimit) {
                            isValid = false;
                            inputEl.style.border = "2px solid red";
                        } else {
                            inputEl.style.border = "1px solid #ccc";
                            result[inp.id] = val;
                        }
                    }
                });
                
                if (!isValid) return; 
            }

            closeModal();
            resolve(result);
        });

        newCancelBtn.addEventListener('click', () => {
            closeModal();
            resolve(false);
        });
    });
}

// --- Drawer Menu Toggles ---
menuBtn.addEventListener('click', () => sideMenu.classList.add('open-drawer'));
closeMenuBtn.addEventListener('click', () => sideMenu.classList.remove('open-drawer'));

// --- Navigation Links ---
navDrills.addEventListener('click', (e) => {
    e.preventDefault();
    sideMenu.classList.remove('open-drawer');
    viewHistory.classList.replace('active-view', 'hidden-view');
    viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
    viewTraining.classList.replace('active-view', 'hidden-view');
    viewExercises.classList.replace('hidden-view', 'active-view');
    pageTitle.textContent = "תרגילים";
    loadCurrentSets(); 
});

navHistory.addEventListener('click', (e) => {
    e.preventDefault();
    sideMenu.classList.remove('open-drawer');
    viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
    loadHistory(); 
});

// --- Fetch & Display Exercises ---
async function loadExercises() {
    try {
        const response = await fetch(`${API_BASE}/exercises`);
        const result = await response.json();
        if (result.message === "success") renderExercises(result.data);
    } catch (error) {
        exerciseList.innerHTML = '<li>שגיאה בטעינת הנתונים. האם השרת פועל?</li>';
    }
}

function renderExercises(exercises) {
    exerciseList.innerHTML = ''; 
    exercises.forEach(drill => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <span class="drill-link" style="cursor: pointer;">${drill.name}</span>
            <span class="drill-diff">${drill.muscle}</span>
        `;
        li.addEventListener('click', () => startTraining(drill));
        exerciseList.appendChild(li);
    });
}

// --- Start Training ---
async function startTraining(drill) {
    if (!currentWorkoutId) {
        // Change the fetch request to POST the user ID
        const response = await fetch(`${API_BASE}/workouts/start`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId })
        });
        const data = await response.json();
        currentWorkoutId = data.workoutId;
        
        finishBtnMain.style.display = 'block';
        finishBtnDrill.style.display = 'block';
    }

    currentDrillId = drill.id; 
    currentDrillName.textContent = drill.name;
    drillAnimation.src = drill.media_url; 
    pageTitle.textContent = "אימון נוכחי"; 

    viewExercises.classList.replace('active-view', 'hidden-view');
    viewHistory.classList.replace('active-view', 'hidden-view');
    viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
    viewTraining.classList.replace('hidden-view', 'active-view');
}

// --- Handle Form Submit (Log Drill) ---
logForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const payload = {
        logged_workout_id: currentWorkoutId,
        exercise_id: currentDrillId,
        weight: parseFloat(weightInput.value),
        reps: parseInt(repsInput.value),
        sets: parseInt(setsInput.value) 
    };

    const response = await fetch(`${API_BASE}/logs/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        weightInput.value = ''; 
        repsInput.value = '';
        setsInput.value = '1'; 
        
        // NEW CUSTOM MODAL ALERT
        await openModal("הצלחה", "התרגיל נשמר!", "alert");
        loadCurrentSets(); 
    }
});

// --- Active Session Log (Current Sets) ---
async function loadCurrentSets() {
    if (!currentWorkoutId) {
        currentSetsContainer.style.display = 'none';
        return;
    }

    const response = await fetch(`${API_BASE}/logs/${currentWorkoutId}`);
    const result = await response.json();

    if (result.message === "success" && result.data.length > 0) {
        currentSetsContainer.style.display = 'block';
        currentSetsList.innerHTML = '';

        result.data.forEach((log) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-weight: bold; font-size: 1.1rem;">${log.name}</span> 
                    <span><bdi>${log.weight} ק״ג</bdi> &times; <bdi>${log.reps} חזרות</bdi> &times; <bdi>${log.sets} סטים</bdi></span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="editSet(${log.id}, ${log.weight}, ${log.reps}, ${log.sets}, false)" style="background:none; border:none; cursor:pointer; font-weight: bold;">[ערוך]</button>
                    <button onclick="deleteSet(${log.id}, false)" style="background:none; border:none; cursor:pointer; color: red; font-weight: bold;">[X]</button>
                </div>
            `;
            currentSetsList.appendChild(li);
        });
    } else {
        currentSetsContainer.style.display = 'none'; 
    }
}

// --- Delete & Edit (Handles Both Views) ---
window.deleteSet = async function(setId, isHistoryMode = false) {
    // NEW CUSTOM MODAL CONFIRM
    const confirmed = await openModal("מחיקה", "להסיר תרגיל זה?", "confirm");
    
    if (confirmed) {
        await fetch(`${API_BASE}/logs/set/${setId}`, { method: 'DELETE' });
        if (isHistoryMode) openWorkoutDetails(activeHistoryWorkoutId, activeHistoryDate);
        else loadCurrentSets(); 
    }
}

window.editSet = async function(setId, oldWeight, oldReps, oldSets, isHistoryMode = false) {
    // Added type: 'number' to these inputs
    const newVals = await openModal("עריכת תרגיל", "", "prompt", [
        { id: 'weight', label: 'משקל (ק״ג)', value: oldWeight, type: 'number' },
        { id: 'reps', label: 'חזרות', value: oldReps, type: 'number' },
        { id: 'sets', label: 'סטים', value: oldSets, type: 'number' }
    ]);

    if (newVals) {
        await fetch(`${API_BASE}/logs/set/${setId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                weight: parseFloat(newVals.weight), 
                reps: parseInt(newVals.reps), 
                sets: parseInt(newVals.sets) 
            })
        });
        
        if (isHistoryMode) openWorkoutDetails(activeHistoryWorkoutId, activeHistoryDate);
        else loadCurrentSets(); 
    }
}

// --- Navigation & Finish Buttons ---
backListBtn.addEventListener('click', () => {
    pageTitle.textContent = "תרגילים";
    viewTraining.classList.replace('active-view', 'hidden-view');
    viewExercises.classList.replace('hidden-view', 'active-view');
    loadCurrentSets(); 
});

async function finishWorkoutSession() {
    if (currentWorkoutId) {
        await fetch(`${API_BASE}/workouts/finish/${currentWorkoutId}`, { method: 'PUT' });
        currentWorkoutId = null; 
        currentDrillId = null;
        
        finishBtnMain.style.display = 'none';
        finishBtnDrill.style.display = 'none';
        
        // NEW CUSTOM MODAL ALERT
        await openModal("הצלחה", "האימון נשמר בהיסטוריה!", "alert");
        
        pageTitle.textContent = "תרגילים";
        viewTraining.classList.replace('active-view', 'hidden-view');
        viewHistory.classList.replace('active-view', 'hidden-view');
        viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
        viewExercises.classList.replace('hidden-view', 'active-view');
        loadCurrentSets(); 
    }
}

finishBtnMain.addEventListener('click', finishWorkoutSession);
finishBtnDrill.addEventListener('click', finishWorkoutSession);

// --- Fetch & Display History ---
async function loadHistory() {
    try {
        // Request to ask for the specific user's history
        const response = await fetch(`${API_BASE}/workouts/history/${currentUserId}`);
        const result = await response.json();
        
        if (result.message === "success") {
            historyList.innerHTML = ''; 
            
            result.data.forEach(workout => {
                const dateObj = new Date(workout.start_time);
                const displayDate = dateObj.toLocaleDateString('he-IL');
                
                const li = document.createElement('li');
                li.className = 'list-item';
                li.style.cursor = 'pointer'; 
                li.innerHTML = `
                    <span class="drill-link" style="font-size: 1rem;">אימון: ${displayDate}</span>
                    <span class="drill-diff">${workout.total_drills} תרגילים</span>
                `;
                
                li.addEventListener('click', () => openWorkoutDetails(workout.id, displayDate));
                
                historyList.appendChild(li);
            });

            viewExercises.classList.replace('active-view', 'hidden-view');
            viewTraining.classList.replace('active-view', 'hidden-view');
            viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
            viewHistory.classList.replace('hidden-view', 'active-view');
            pageTitle.textContent = "אימונים שלי";
        }
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

// --- View Past Workout Details ---
async function openWorkoutDetails(workoutId, dateString) {
    activeHistoryWorkoutId = workoutId;
    activeHistoryDate = dateString;

    const response = await fetch(`${API_BASE}/logs/${workoutId}`);
    const result = await response.json();

    detailsTitle.textContent = `אימון: ${dateString}`;
    detailsList.innerHTML = '';

    if (result.message === "success" && result.data.length > 0) {
        result.data.forEach((log) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-weight: bold; font-size: 1.1rem;">${log.name}</span> 
                    <span><bdi>${log.weight} ק״ג</bdi> &times; <bdi>${log.reps} חזרות</bdi> &times; <bdi>${log.sets} סטים</bdi></span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="editSet(${log.id}, ${log.weight}, ${log.reps}, ${log.sets}, true)" style="background:none; border:none; cursor:pointer; font-weight: bold;">[ערוך]</button>
                    <button onclick="deleteSet(${log.id}, true)" style="background:none; border:none; cursor:pointer; color: red; font-weight: bold;">[X]</button>
                </div>
            `;
            detailsList.appendChild(li);
        });
    } else {
        detailsList.innerHTML = '<li class="list-item">לא נרשמו תרגילים.</li>';
    }

    viewHistory.classList.replace('active-view', 'hidden-view');
    viewWorkoutDetails.classList.replace('hidden-view', 'active-view');
}

// Handle Back Button in History
backHistoryBtn.addEventListener('click', () => {
    activeHistoryWorkoutId = null;
    viewWorkoutDetails.classList.replace('active-view', 'hidden-view');
    viewHistory.classList.replace('hidden-view', 'active-view');
    loadHistory(); 
});

// Handle Delete Entire Workout
deleteWorkoutBtn.addEventListener('click', async () => {
    if (!activeHistoryWorkoutId) return;

    // NEW CUSTOM MODAL CONFIRM
    const confirmed = await openModal("מחיקה", "למחוק אימון זה לגמרי? פעולה זו אינה הפיכה.", "confirm");
    
    if (confirmed) {
        await fetch(`${API_BASE}/workouts/${activeHistoryWorkoutId}`, { method: 'DELETE' });
        backHistoryBtn.click();
    }
});

// --- Authentication & KICKOFF ---
const changeUserBtn = document.getElementById('nav-change-user');

changeUserBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('workout_user_id'); // Wipe memory
    location.reload(); // Refresh the page to trigger the login modal
});

async function initApp() {
    currentUserId = localStorage.getItem('workout_user_id');
    
    // If there is no ID saved on the phone, force them to enter one
    if (!currentUserId) {
        const result = await openModal(
            "ברוך הבא!", 
            "בחר קוד מתאמן (אותיות, מספרים, או סמלים):", 
            "mandatory", // CHANGED: Using our new strict mode
            [{ id: 'userId', label: 'קוד מתאמן', value: '', type: 'text' }]
        );
        
        // Since there is no cancel button, we know they typed a valid ID!
        currentUserId = result.userId;
        localStorage.setItem('workout_user_id', currentUserId); 
    }
    
    loadExercises();
}

initApp(); // Start the engine!
initApp(); // Start the engine!