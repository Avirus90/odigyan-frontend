class OdigyanApp {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL;
        this.currentUser = null;
        this.isAdmin = false;
        this.initialize();
    }

    async initialize() {
        this.setupEventListeners();
        await this.initializeFirebase();
        await this.loadInitialData();
    }

    async initializeFirebase() {
        try {
            const app = firebase.initializeApp(window.FIREBASE_CONFIG);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Listen for auth state changes
            this.auth.onAuthStateChanged(user => this.handleAuthStateChange(user));
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            this.updateUIForLoggedInUser(user);
            
            // Check if admin
            this.isAdmin = user.email === 'bimbadharbaghel0@gmail.com';
            
            if (this.isAdmin) {
                document.getElementById('adminPanel').style.display = 'block';
                await this.loadStudents();
            } else {
                document.getElementById('studentDashboard').style.display = 'block';
                await this.checkStudentRegistration(user);
                await this.loadEnrolledCourses();
            }
        } else {
            this.currentUser = null;
            this.updateUIForLoggedOutUser();
        }
    }

    // API CALLS TO BACKEND
    async loadCourses() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/courses`);
            const data = await response.json();
            
            if (data.success) {
                this.displayCourses(data.courses);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showError('Failed to load courses');
        }
    }

    async loadTelegramFiles(courseId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/telegram/files?courseId=${courseId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.files;
            }
            return [];
        } catch (error) {
            console.error('Error loading Telegram files:', error);
            return [];
        }
    }

    async enrollInCourse(courseId) {
        if (!this.currentUser) {
            this.showError('Please sign in first');
            return;
        }

        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/courses/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId: courseId,
                    userId: this.currentUser.uid
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Successfully enrolled in course!');
                await this.loadEnrolledCourses();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error enrolling:', error);
            this.showError('Failed to enroll in course');
        }
    }

    async registerStudent(studentData) {
        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/students/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(studentData)
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    async loadStudents() {
        if (!this.isAdmin) return;

        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/admin/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayStudents(data.students);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async addCourse(courseData) {
        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/admin/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(courseData)
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error adding course:', error);
            return false;
        }
    }

    async addBanner(bannerData) {
        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/admin/banners`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bannerData)
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error adding banner:', error);
            return false;
        }
    }

    async getMockTest(courseId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/telegram/mocktest?courseId=${courseId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.questions;
            }
            return [];
        } catch (error) {
            console.error('Error loading mock test:', error);
            return [];
        }
    }

    async submitTestResult(testData) {
        try {
            const token = await this.currentUser.getIdToken();
            
            const response = await fetch(`${this.apiBaseUrl}/api/students/test-result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            return response.ok;
        } catch (error) {
            console.error('Error submitting test:', error);
            return false;
        }
    }

    // Utility Methods
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }

    updateUIForLoggedInUser(user) {
        document.getElementById('userName').textContent = user.displayName || user.email;
        document.getElementById('userAvatar').textContent = user.displayName ? 
            user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
    }

    updateUIForLoggedOutUser() {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('studentDashboard').style.display = 'none';
    }

    // UI Methods (simplified)
    displayCourses(courses) {
        const container = document.getElementById('coursesContainer');
        container.innerHTML = '';
        
        courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            container.appendChild(courseCard);
        });
    }

    createCourseCard(course) {
        const div = document.createElement('div');
        div.className = 'course-card';
        div.innerHTML = `
            <div class="course-header">
                <h3 class="course-title">${course.name}</h3>
            </div>
            <div class="course-content">
                <p>${course.description}</p>
                <button class="enroll-btn" onclick="app.enrollInCourse('${course.id}')">
                    Enroll Now
                </button>
            </div>
        `;
        return div;
    }

    displayStudents(students) {
        const container = document.getElementById('studentsList');
        container.innerHTML = '<h4>Registered Students</h4>';
        
        students.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.className = 'student-card';
            studentDiv.innerHTML = `
                <div class="student-info">
                    <h4>${student.fullName}</h4>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Phone:</strong> ${student.phone}</p>
                </div>
            `;
            container.appendChild(studentDiv);
        });
    }
}

// Initialize app
window.app = new OdigyanApp();
