// API Endpoints
const BASE_URL = "https://edumanagebackend-production.up.railway.app";

const STUDENT_API = `${BASE_URL}/student`;
const ATTENDANCE_API = `${BASE_URL}/attendance`;
const MARKS_API = `${BASE_URL}/marks`;


// DOM Elements
const navItems = document.querySelectorAll('.nav-menu li');
const contentSections = document.querySelectorAll('.content-section');
const studentForm = document.getElementById('studentForm');
const attendanceForm = document.getElementById('attendanceForm');
const marksForm = document.getElementById('marksForm');
const addStudentBtn = document.getElementById('addStudentBtn');
const addAttendanceBtn = document.getElementById('addAttendanceBtn');
const addMarksBtn = document.getElementById('addMarksBtn');
const studentModal = document.getElementById('studentModal');
const attendanceModal = document.getElementById('attendanceModal');
const marksModal = document.getElementById('marksModal');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const closeButtons = document.querySelectorAll('.close-btn, .cancel-btn');

// Global Variables
let currentStudentId = null;
let currentAttendanceId = null;
let currentMarksId = null;
let studentsData = [];
let attendanceData = [];
let marksData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load all data
    loadStudents();
    loadAttendance();
    loadMarks();

    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const target = item.getAttribute('data-target');
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Modal buttons
    addStudentBtn.addEventListener('click', () => openStudentModal());
    addAttendanceBtn.addEventListener('click', () => openAttendanceModal());
    addMarksBtn.addEventListener('click', () => openMarksModal());

    // Form submissions
    studentForm.addEventListener('submit', handleStudentSubmit);
    attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    marksForm.addEventListener('submit', handleMarksSubmit);

    // Close modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            studentModal.classList.remove('active');
            attendanceModal.classList.remove('active');
            marksModal.classList.remove('active');
            confirmModal.classList.remove('active');
        });
    });

    // Confirm delete
    confirmDeleteBtn.addEventListener('click', handleDelete);
}

// ==================== Student Functions ====================
async function loadStudents() {
    try {
        const response = await fetch(STUDENT_API);
        if (!response.ok) throw new Error('Failed to fetch students');

        studentsData = await response.json();
        renderStudentsTable(studentsData);
        updateDashboardStats();

        // Populate student dropdowns in other forms
        populateStudentDropdowns();
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Failed to load students. Please try again.');
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentList');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
        return;
    }

    students.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.email}</td>
      <td>${student.age}</td>
      <td>${student.class}</td>
      <td class="actions">
        <button class="btn btn-sm btn-primary edit-student" data-id="${student.id}">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger delete-student" data-id="${student.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editStudent(id);
        });
    });

    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete('student', id);
        });
    });
}

function openStudentModal(student = null) {
    const modalTitle = document.getElementById('studentModalTitle');
    const form = document.getElementById('studentForm');

    if (student) {
        modalTitle.textContent = 'Edit Student';
        document.getElementById('student_id').value = student.id;
        document.getElementById('student_name').value = student.name;
        document.getElementById('student_email').value = student.email;
        document.getElementById('student_age').value = student.age;
        document.getElementById('student_class').value = student.class;
    } else {
        modalTitle.textContent = 'Add New Student';
        form.reset();
        currentStudentId = null;
    }

    studentModal.classList.add('active');
}

function editStudent(id) {
    const student = studentsData.find(s => s.id == id);
    if (student) {
        currentStudentId = id;
        openStudentModal(student);
    }
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const studentData = {
        name: document.getElementById('student_name').value,
        email: document.getElementById('student_email').value,
        age: parseInt(document.getElementById('student_age').value),
        class: parseInt(document.getElementById('student_class').value)
    };

    try {
        let response;
        const id = document.getElementById('student_id').value;

        if (id) {
            // Update existing student
            response = await fetch(`${STUDENT_API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        } else {
            // Add new student
            response = await fetch(STUDENT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        }

        if (!response.ok) throw new Error('Failed to save student');

        showSuccess(`Student ${id ? 'updated' : 'added'} successfully!`);
        studentModal.classList.remove('active');
        loadStudents();
    } catch (error) {
        console.error('Error saving student:', error);
        showError('Failed to save student. Please try again.');
    }
}

// ==================== Attendance Functions ====================
async function loadAttendance() {
    try {
        const response = await fetch(ATTENDANCE_API);
        if (!response.ok) throw new Error('Failed to fetch attendance');

        attendanceData = await response.json();
        renderAttendanceTable(attendanceData);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading attendance:', error);
        showError('Failed to load attendance. Please try again.');
    }
}

function renderAttendanceTable(attendance) {
    const tbody = document.getElementById('attendanceList');
    tbody.innerHTML = '';

    if (attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found</td></tr>';
        return;
    }

    attendance.forEach(record => {
        const student = studentsData.find(s => s.id == record.student_id);
        const studentName = student ? student.name : 'Unknown';

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${record.id}</td>
      <td>${record.student_id}</td>
      <td>${studentName}</td>
      <td>${formatDate(record.date)}</td>
      <td><span class="status-badge ${getStatusClass(record.status)}">${record.status}</span></td>
      <td class="actions">
        <button class="btn btn-sm btn-primary edit-attendance" data-id="${record.id}">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger delete-attendance" data-id="${record.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-attendance').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editAttendance(id);
        });
    });

    document.querySelectorAll('.delete-attendance').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete('attendance', id);
        });
    });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'present': return 'bg-success';
        case 'absent': return 'bg-danger';
        case 'late': return 'bg-warning';
        default: return 'bg-info';
    }
}

// ✅ Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD only
}

function openAttendanceModal(record = null) {
    const modalTitle = document.getElementById('attendanceModalTitle');
    const form = document.getElementById('attendanceForm');

    if (record) {
        modalTitle.textContent = 'Edit Attendance Record';
        document.getElementById('attendance_id').value = record.id;
        document.getElementById('attendance_student_id').value = record.student_id;
        document.getElementById('attendance_date').value = formatDate(record.date);
        document.getElementById('attendance_status').value = record.status;
    } else {
        modalTitle.textContent = 'Add Attendance Record';
        form.reset();
        // ✅ Default new record date = today
        document.getElementById('attendance_date').valueAsDate = new Date();
        currentAttendanceId = null;
    }

    attendanceModal.classList.add('active');
}

function editAttendance(id) {
    const record = attendanceData.find(a => a.id == id);
    if (record) {
        currentAttendanceId = id;
        openAttendanceModal(record);
    }
}

async function handleAttendanceSubmit(e) {
    e.preventDefault();

    const attendanceData = {
        student_id: parseInt(document.getElementById('attendance_student_id').value),
        date: document.getElementById('attendance_date').value,
        status: document.getElementById('attendance_status').value
    };

    try {
        let response;
        const id = document.getElementById('attendance_id').value;

        if (id) {
            // Update existing record
            response = await fetch(`${ATTENDANCE_API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attendanceData)
            });
        } else {
            // Add new record
            response = await fetch(ATTENDANCE_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attendanceData)
            });
        }

        if (!response.ok) throw new Error('Failed to save attendance record');

        showSuccess(`Attendance record ${id ? 'updated' : 'added'} successfully!`);
        attendanceModal.classList.remove('active');
        loadAttendance();
    } catch (error) {
        console.error('Error saving attendance:', error);
        showError('Failed to save attendance record. Please try again.');
    }
}


// ==================== Marks Functions ====================
async function loadMarks() {
    try {
        const response = await fetch(MARKS_API);
        if (!response.ok) throw new Error('Failed to fetch marks');

        marksData = await response.json();
        renderMarksTable(marksData);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading marks:', error);
        showError('Failed to load marks. Please try again.');
    }
}

function renderMarksTable(marks) {
    const tbody = document.getElementById('marksList');
    tbody.innerHTML = '';

    if (marks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No marks records found</td></tr>';
        return;
    }

    marks.forEach(record => {
        const student = studentsData.find(s => s.id == record.student_id);
        const studentName = student ? student.name : 'Unknown';
        const percentage = Math.round((record.marks_obtained / record.total_marks) * 100);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${record.id}</td>
      <td>${record.student_id}</td>
      <td>${studentName}</td>
      <td>${record.subject}</td>
      <td>${record.marks_obtained}/${record.total_marks}</td>
      <td>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
          <span>${percentage}%</span>
        </div>
      </td>
      <td class="actions">
        <button class="btn btn-sm btn-primary edit-marks" data-id="${record.id}">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger delete-marks" data-id="${record.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-marks').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editMarks(id);
        });
    });

    document.querySelectorAll('.delete-marks').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete('marks', id);
        });
    });
}

function openMarksModal(record = null) {
    const modalTitle = document.getElementById('marksModalTitle');
    const form = document.getElementById('marksForm');

    if (record) {
        modalTitle.textContent = 'Edit Marks';
        document.getElementById('marks_id').value = record.id;
        document.getElementById('marks_student_id').value = record.student_id;
        document.getElementById('marks_subject').value = record.subject;
        document.getElementById('marks_obtained').value = record.marks_obtained;
        document.getElementById('marks_total').value = record.total_marks;
    } else {
        modalTitle.textContent = 'Add Marks';
        form.reset();
        currentMarksId = null;
    }

    marksModal.classList.add('active');
}

function editMarks(id) {
    const record = marksData.find(m => m.id == id);
    if (record) {
        currentMarksId = id;
        openMarksModal(record);
    }
}

async function handleMarksSubmit(e) {
    e.preventDefault();

    const marksData = {
        student_id: parseInt(document.getElementById('marks_student_id').value),
        subject: document.getElementById('marks_subject').value,
        marks_obtained: parseInt(document.getElementById('marks_obtained').value),
        total_marks: parseInt(document.getElementById('marks_total').value)
    };

    try {
        let response;
        const id = document.getElementById('marks_id').value;

        if (id) {
            // Update existing record
            response = await fetch(`${MARKS_API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marksData)
            });
        } else {
            // Add new record
            response = await fetch(MARKS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marksData)
            });
        }

        if (!response.ok) throw new Error('Failed to save marks record');

        showSuccess(`Marks record ${id ? 'updated' : 'added'} successfully!`);
        marksModal.classList.remove('active');
        loadMarks();
    } catch (error) {
        console.error('Error saving marks:', error);
        showError('Failed to save marks record. Please try again.');
    }
}

// ==================== Utility Functions ====================
function populateStudentDropdowns() {
    const studentDropdowns = [
        document.getElementById('attendance_student_id'),
        document.getElementById('marks_student_id')
    ];

    studentDropdowns.forEach(dropdown => {
        if (dropdown) {
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }

            // Add student options
            studentsData.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (ID: ${student.id})`;
                dropdown.appendChild(option);
            });
        }
    });
}

function confirmDelete(type, id) {
    const message = document.getElementById('confirmMessage');
    let entityName = '';

    switch (type) {
        case 'student':
            entityName = 'student';
            currentStudentId = id;
            break;
        case 'attendance':
            entityName = 'attendance record';
            currentAttendanceId = id;
            break;
        case 'marks':
            entityName = 'marks record';
            currentMarksId = id;
            break;
    }

    message.textContent = `Are you sure you want to delete this ${entityName}? This action cannot be undone.`;
    confirmModal.classList.add('active');
}

async function handleDelete() {
    let apiUrl, type;

    if (currentStudentId) {
        apiUrl = `${STUDENT_API}/${currentStudentId}`;
        type = 'student';
    } else if (currentAttendanceId) {
        apiUrl = `${ATTENDANCE_API}/${currentAttendanceId}`;
        type = 'attendance';
    } else if (currentMarksId) {
        apiUrl = `${MARKS_API}/${currentMarksId}`;
        type = 'marks';
    } else {
        return;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`Failed to delete ${type}`);

        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
        confirmModal.classList.remove('active');

        // Reset current IDs
        currentStudentId = null;
        currentAttendanceId = null;
        currentMarksId = null;

        // Reload data
        if (type === 'student') {
            loadStudents();
        } else if (type === 'attendance') {
            loadAttendance();
        } else if (type === 'marks') {
            loadMarks();
        }
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showError(`Failed to delete ${type}. Please try again.`);
    }
}

function updateDashboardStats() {
    // Total Students
    document.getElementById('totalStudents').textContent = studentsData.length;

    // Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendanceData.filter(a => a.date === today);
    document.getElementById('todayAttendance').textContent = todaysAttendance.length;

    // Average Marks
    if (marksData.length > 0) {
        const totalPercentage = marksData.reduce((sum, mark) => {
            return sum + (mark.marks_obtained / mark.total_marks) * 100;
        }, 0);
        const averagePercentage = Math.round(totalPercentage / marksData.length);
        document.getElementById('averageMarks').textContent = `${averagePercentage}%`;
    } else {
        document.getElementById('averageMarks').textContent = 'N/A';
    }

    // Recent Activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';

    // Combine all activities
    const allActivities = [
        ...studentsData.map(s => ({
            type: 'student',
            id: s.id,
            name: s.name,
            date: s.createdAt || new Date().toISOString(),
            action: 'added'
        })),
        ...attendanceData.map(a => ({
            type: 'attendance',
            id: a.id,
            name: studentsData.find(s => s.id == a.student_id)?.name || 'Unknown',
            date: a.date,
            action: 'marked'
        })),
        ...marksData.map(m => ({
            type: 'marks',
            id: m.id,
            name: studentsData.find(s => s.id == m.student_id)?.name || 'Unknown',
            date: m.createdAt || new Date().toISOString(),
            action: 'recorded'
        }))
    ];

    // Sort by date (newest first)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get top 5 recent activities
    const recentActivities = allActivities.slice(0, 5);

    // Render activities
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        let icon, actionText;
        switch (activity.type) {
            case 'student':
                icon = 'fas fa-user-plus';
                actionText = 'New student added';
                break;
            case 'attendance':
                icon = 'fas fa-calendar-check';
                actionText = 'Attendance marked';
                break;
            case 'marks':
                icon = 'fas fa-chart-bar';
                actionText = 'Marks recorded';
                break;
        }

        activityItem.innerHTML = `
      <div class="activity-icon">
        <i class="${icon}"></i>
      </div>
      <div class="activity-details">
        <p>${actionText} for ${activity.name}</p>
        <small>${formatDate(activity.date)}</small>
      </div>
    `;

        activityList.appendChild(activityItem);
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showSuccess(message) {
    // In a real app, you might use a more sophisticated notification system
    alert(`✅ ${message}`);
}

function showError(message) {
    // In a real app, you might use a more sophisticated notification system
    alert(`❌ ${message}`);
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = loginForm.querySelector("input[type='text']").value;
    const password = loginForm.querySelector("input[type='password']").value;

    try {
        const response = await fetch("https://edumanagebackend-production.up.railway.app/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error("Login failed");

        const data = await response.json();

        // Save token (localStorage/sessionStorage)
        localStorage.setItem("token", data.token);

        // Redirect
        window.location.href = "dashboard.html";

    } catch (err) {
        alert("Invalid username or password!");
    }
});

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const toggleBtn = document.getElementById("toggleBtn");
const panelTitle = document.getElementById("panelTitle");
const panelDesc = document.getElementById("panelDesc");
const toRegister = document.getElementById("toRegister");
const toLogin = document.getElementById("toLogin");
const loginTogglePassword = document.getElementById("loginTogglePassword");
const registerTogglePassword = document.getElementById("registerTogglePassword");
const loginPassword = document.getElementById("loginPassword");
const registerPassword = document.getElementById("registerPassword");
const registerSuccess = document.getElementById("registerSuccess");

// Toggle password visibility
function setupPasswordToggle(toggleElement, passwordField) {
    toggleElement.addEventListener('click', function () {
        // Toggle the password visibility
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);

        // Toggle the eye icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Set up password toggles
setupPasswordToggle(loginTogglePassword, loginPassword);
setupPasswordToggle(registerTogglePassword, registerPassword);

function showRegister() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    toggleBtn.textContent = "Sign In";
    panelTitle.textContent = "Welcome Back!";
    panelDesc.textContent = "To keep connected with us please login with your personal info.";
}

function showLogin() {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    toggleBtn.textContent = "Sign Up";
    panelTitle.textContent = "Hello, Friend!";
    panelDesc.textContent = "Enter your personal details and start your journey with us.";
}

toggleBtn.addEventListener("click", () => {
    if (loginForm.style.display === "block" || loginForm.style.display === "") {
        showRegister();
    } else {
        showLogin();
    }
});

toRegister.addEventListener("click", (e) => {
    e.preventDefault();
    showRegister();
});

toLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showLogin();
});

// Form submission handling
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('.btn');
    btn.classList.add('loading');

    // Simulate login process
    setTimeout(() => {
        btn.classList.remove('loading');
        alert("Login successful! Redirecting to dashboard...");
        // Add your actual login logic here
    }, 1500);
});

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('.btn');
    btn.classList.add('loading');

    // Simulate registration process
    setTimeout(() => {
        btn.classList.remove('loading');
        // Show success message
        registerSuccess.style.display = "block";

        setTimeout(() => {
            showLogin();
            registerSuccess.style.display = "none";
            registerForm.reset();
        }, 2000);
    }, 1500);
});
