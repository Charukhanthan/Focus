// State Management
const state = {
    tasks: JSON.parse(localStorage.getItem('zenfocus_tasks')) || [],
    notes: localStorage.getItem('zenfocus_notes') || '',
    timer: {
        timeLeft: 25 * 60,
        mode: 'focus', // focus, short, long
        isRunning: false,
        intervalId: null
    }
};

// DOM Elements
const elements = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date-display'),
    greeting: document.getElementById('greeting'),
    taskList: document.getElementById('task-list'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskCount: document.getElementById('task-count'),
    timerText: document.getElementById('timer-text'),
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    timerCircle: document.querySelector('.progress-ring__circle'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    quickNotes: document.getElementById('quick-notes')
};

// Constants
const TIMER_MODES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Initialization
function init() {
    setupClock();
    setupTasks();
    setupTimer();
    setupNotes();

    // Set initial circle dasharray
    elements.timerCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    elements.timerCircle.style.strokeDashoffset = 0;
}

// --- Clock & Greeting ---
function setupClock() {
    const updateTime = () => {
        const now = new Date();
        elements.clock.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        elements.date.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        const hour = now.getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';

        elements.greeting.textContent = greeting;
    };

    updateTime();
    setInterval(updateTime, 1000); // Update every second for accuracy
}

// --- Task Manager ---
function setupTasks() {
    renderTasks();

    elements.addTaskBtn.addEventListener('click', addTask);
    elements.newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

function addTask() {
    const text = elements.newTaskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now(),
        text,
        completed: false
    };

    state.tasks.unshift(task); // Add to top
    saveTasks();
    renderTasks();
    elements.newTaskInput.value = '';
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('zenfocus_tasks', JSON.stringify(state.tasks));
}

function renderTasks() {
    elements.taskList.innerHTML = '';
    const activeCount = state.tasks.filter(t => !t.completed).length;
    elements.taskCount.textContent = `${activeCount} remaining`;

    state.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span>${escapeHtml(task.text)}</span>
            <button class="delete-btn"><span class="material-icons-round">delete</span></button>
        `;

        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

        elements.taskList.appendChild(li);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Focus Timer ---
function setupTimer() {
    updateTimerDisplay();

    elements.startBtn.addEventListener('click', toggleTimer);
    elements.resetBtn.addEventListener('click', resetTimer);

    elements.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimerMode(btn.dataset.mode);
            elements.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setTimerMode(mode) {
    state.timer.mode = mode;
    state.timer.timeLeft = TIMER_MODES[mode];
    state.timer.isRunning = false;
    clearInterval(state.timer.intervalId);
    updateTimerDisplay();
    updateStartButton();
    setProgress(100);
}

function toggleTimer() {
    if (state.timer.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    state.timer.isRunning = true;
    updateStartButton();

    state.timer.intervalId = setInterval(() => {
        state.timer.timeLeft--;
        updateTimerDisplay();

        const totalTime = TIMER_MODES[state.timer.mode];
        const progress = (state.timer.timeLeft / totalTime) * 100;
        setProgress(progress);

        if (state.timer.timeLeft <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    state.timer.isRunning = false;
    clearInterval(state.timer.intervalId);
    updateStartButton();
}

function resetTimer() {
    pauseTimer();
    state.timer.timeLeft = TIMER_MODES[state.timer.mode];
    updateTimerDisplay();
    setProgress(100);
}

function completeTimer() {
    pauseTimer();
    // Play sound or notification here
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); // Simple beep
    audio.play().catch(e => console.log('Audio play failed', e));
    alert('Timer Completed!');
    resetTimer();
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timer.timeLeft / 60);
    const seconds = state.timer.timeLeft % 60;
    elements.timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStartButton() {
    elements.startBtn.innerHTML = state.timer.isRunning
        ? '<span class="material-icons-round">pause</span> Pause'
        : '<span class="material-icons-round">play_arrow</span> Start';
}

function setProgress(percent) {
    const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
    elements.timerCircle.style.strokeDashoffset = offset;
}

// --- Quick Notes ---
function setupNotes() {
    elements.quickNotes.value = state.notes;
    elements.quickNotes.addEventListener('input', (e) => {
        state.notes = e.target.value;
        localStorage.setItem('zenfocus_notes', state.notes);
    });
}

// --- Settings ---
function setupSettings() {
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const saveBtn = document.getElementById('save-settings-btn');

    const inputs = {
        focus: document.getElementById('focus-time'),
        short: document.getElementById('short-break-time'),
        long: document.getElementById('long-break-time')
    };

    // Load saved settings
    const savedSettings = JSON.parse(localStorage.getItem('zenfocus_settings'));
    if (savedSettings) {
        TIMER_MODES.focus = savedSettings.focus * 60;
        TIMER_MODES.short = savedSettings.short * 60;
        TIMER_MODES.long = savedSettings.long * 60;

        // Update current timer if not running
        if (!state.timer.isRunning) {
            state.timer.timeLeft = TIMER_MODES[state.timer.mode];
            updateTimerDisplay();
        }
    }

    // Populate inputs
    inputs.focus.value = TIMER_MODES.focus / 60;
    inputs.short.value = TIMER_MODES.short / 60;
    inputs.long.value = TIMER_MODES.long / 60;

    // Event Listeners
    settingsBtn.addEventListener('click', () => {
        modal.showModal();
    });

    closeBtn.addEventListener('click', () => {
        modal.close();
    });

    saveBtn.addEventListener('click', () => {
        const newSettings = {
            focus: parseInt(inputs.focus.value),
            short: parseInt(inputs.short.value),
            long: parseInt(inputs.long.value)
        };

        // Validate
        if (newSettings.focus < 1 || newSettings.short < 1 || newSettings.long < 1) {
            alert('Please enter valid times (minimum 1 minute).');
            return;
        }

        // Save
        localStorage.setItem('zenfocus_settings', JSON.stringify(newSettings));

        // Update Constants
        TIMER_MODES.focus = newSettings.focus * 60;
        TIMER_MODES.short = newSettings.short * 60;
        TIMER_MODES.long = newSettings.long * 60;

        // Update current timer
        if (!state.timer.isRunning) {
            state.timer.timeLeft = TIMER_MODES[state.timer.mode];
            updateTimerDisplay();
            setProgress(100);
        }

        modal.close();
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            modal.close();
        }
    });
}

// --- Calendar ---
function setupCalendar() {
    const datetimeTrigger = document.getElementById('datetime-trigger');
    const modal = document.getElementById('calendar-modal');
    const closeBtn = document.getElementById('close-calendar-btn');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const monthYear = document.getElementById('calendar-month-year');
    const grid = document.getElementById('calendar-grid');

    let currentDate = new Date();

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        monthYear.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Clear grid
        grid.innerHTML = '';

        // Days header
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        days.forEach(day => {
            const div = document.createElement('div');
            div.className = 'calendar-day-header';
            div.textContent = day;
            grid.appendChild(div);
        });

        // First day of month
        const firstDay = new Date(year, month, 1).getDay();
        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            grid.appendChild(div);
        }

        // Days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = i;

            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                div.classList.add('today');
            }

            grid.appendChild(div);
        }
    }

    datetimeTrigger.addEventListener('click', () => {
        renderCalendar(currentDate);
        modal.showModal();
    });

    closeBtn.addEventListener('click', () => modal.close());

    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            modal.close();
        }
    });
}

// --- Ambient Sounds ---
function setupAmbientSounds() {
    const sounds = {
        rain: new Audio('./rain.mp3'),
        forest: new Audio('./forest.mp3'),
        stream: new Audio('./stream.mp3'),
        white_noise: new Audio('./white_noise.mp3')
    };

    // Loop all sounds and set initial volume
    const volumeSlider = document.getElementById('volume-slider');
    const initialVolume = volumeSlider.value;

    Object.values(sounds).forEach(audio => {
        audio.loop = true;
        audio.volume = initialVolume;
    });

    const buttons = document.querySelectorAll('.sound-btn');
    let currentSound = null;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const soundName = btn.dataset.sound;
            const audio = sounds[soundName];

            if (currentSound === audio) {
                // Toggle off
                audio.pause();
                btn.classList.remove('active');
                currentSound = null;
            } else {
                // Stop previous
                if (currentSound) {
                    currentSound.pause();
                    document.querySelector('.sound-btn.active')?.classList.remove('active');
                }

                // Play new
                audio.play().catch(e => console.log('Audio play failed', e));
                btn.classList.add('active');
                currentSound = audio;
            }
        });
    });

    // Volume Control
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        Object.values(sounds).forEach(audio => {
            audio.volume = volume;
        });
    });
}

// Run
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupSettings();
    setupCalendar();
    setupAmbientSounds();
});
