// Main Application Class
class OdigyanApp {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL;
        this.currentUser = null;
        this.isAdmin = false;
        this.userToken = null;
        this.enrolledCourses = [];
        this.testResults = [];
        this.currentTest = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        try {
            this.showLoading();
            
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Check authentication state
            await this.checkAuthState();
            
            // Load initial data
            await this.loadInitialData();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to initialize application');
            this.hideLoading();
        }
    }
    
    // Firebase Initialization
    async initializeFirebase() {
        try {
            // Initialize Firebase App
            if (!firebase.apps.length) {
                this.firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
            } else {
                this.firebaseApp = firebase.app();
            }
            
            // Get Firebase services
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.googleProvider = new firebase.auth.GoogleAuthProvider();
            
            // Configure Google Sign-in
            this.googleProvider.setCustomParameters({
                prompt: 'select_account'
            });
            
            console.log('Firebase initialized successfully');
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw new Error('Failed to initialize Firebase');
        }
    }
    
    // Authentication Methods
    async checkAuthState() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleUserSignedIn(user);
            } else {
                this.handleUserSignedOut();
            }
        });
    }
    
    async handleUserSignedIn(user) {
        try {
            this.currentUser = user;
            this.userToken = await user.getIdToken();
            
            // Update UI
            this.updateUserUI(user);
            
            // Check if admin
            this.isAdmin = user.email === window.ADMIN_CONFIG.adminEmail;
            
            if (this.isAdmin) {
                this.showAdminPanel();
                await this.loadAdminData();
            } else {
                this.showStudentDashboard();
                await this.checkStudentRegistration();
                await this.loadStudentData();
            }
            
        } catch (error) {
            console.error('Error handling signed in user:', error);
        }
    }
    
    handleUserSignedOut() {
        this.currentUser = null;
        this.userToken = null;
        this.isAdmin = false;
        
        // Update UI
        this.updateUserUI(null);
        
        // Hide admin/student panels
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('studentDashboard').style.display = 'none';
    }
    
    async signInWithGoogle() {
        try {
            this.showLoading();
            await this.auth.signInWithPopup(this.googleProvider);
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showError('Failed to sign in with Google');
        } finally {
            this.hideLoading();
        }
    }
    
    async signOut() {
        try {
            this.showLoading();
            await this.auth.signOut();
            this.showSuccess('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            this.showError('Failed to sign out');
        } finally {
            this.hideLoading();
        }
    }
    
    // Student Registration
    async checkStudentRegistration() {
        if (!this.currentUser || this.isAdmin) return;
        
        try {
            const response = await this.apiRequest(
                window.API_ENDPOINTS.getStudent,
                'GET'
            );
            
            if (!response.success) {
                // Student not registered, show registration modal
                this.openModal('registrationModal');
            }
            
        } catch (error) {
            console.error('Error checking registration:', error);
        }
    }
    
    async registerStudent(studentData) {
        try {
            this.showLoading();
            
            const response = await this.apiRequest(
                window.API_ENDPOINTS.registerStudent,
                'POST',
                studentData
            );
            
            if (response.success) {
                this.closeModal('registrationModal');
                this.showSuccess('Registration completed successfully!');
                await this.loadStudentData();
            } else {
                throw new Error(response.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // Course Management
    async loadCourses() {
        try {
            const response = await this.apiRequest(
                window.API_ENDPOINTS.getCourses,
                'GET'
            );
            
            if (response.success) {
                this.displayCourses(response.courses);
            } else {
                throw new Error(response.error || 'Failed to load courses');
            }
            
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showError('Failed to load courses');
            this.displayCourses([]);
        }
    }
    
    async enrollInCourse(courseId) {
        if (!this.currentUser) {
            this.showError('Please sign in to enroll in courses');
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await this.apiRequest(
                window.API_ENDPOINTS.enrollCourse,
                'POST',
                { courseId }
            );
            
            if (response.success) {
                this.showSuccess('Successfully enrolled in course!');
                await this.loadStudentData();
            } else {
                throw new Error(response.error || 'Enrollment failed');
            }
            
        } catch (error) {
            console.error('Enrollment error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // Student Dashboard
    async loadStudentData() {
        if (!this.currentUser || this.isAdmin) return;
        
        try {
            const response = await this.apiRequest(
                window.API_ENDPOINTS.getStudent,
                'GET'
            );
            
            if (response.success) {
                this.displayStudentData(response.student, response.enrolledCourses);
            }
            
        } catch (error) {
            console.error('Error loading student data:', error);
        }
    }
    
    // Admin Functions
    async loadAdminData() {
        if (!this.isAdmin) return;
        
        try {
            // Load students
            const studentsResponse = await this.apiRequest(
                window.API_ENDPOINTS.getStudents,
                'GET'
            );
            
            if (studentsResponse.success) {
                this.displayStudents(studentsResponse.students);
            }
            
            // Load courses for management
            await this.loadCourses();
            
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }
    
    async addCourse(courseData) {
        try {
            this.showLoading();
            
            const response = await this.apiRequest(
                window.API_ENDPOINTS.addCourse,
                'POST',
                courseData
            );
            
            if (response.success) {
                this.showSuccess('Course added successfully!');
                document.getElementById('courseName').value = '';
                document.getElementById('courseDescription').value = '';
                await this.loadCourses();
            } else {
                throw new Error(response.error || 'Failed to add course');
            }
            
        } catch (error) {
            console.error('Error adding course:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async addBanner(bannerData) {
        try {
            this.showLoading();
            
            const response = await this.apiRequest(
                window.API_ENDPOINTS.addBanner,
                'POST',
                bannerData
            );
            
            if (response.success) {
                this.showSuccess('Banner added successfully!');
                document.getElementById('bannerTitle').value = '';
                document.getElementById('bannerDescription').value = '';
            } else {
                throw new Error(response.error || 'Failed to add banner');
            }
            
        } catch (error) {
            console.error('Error adding banner:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // Mock Test Functions
    async loadMockTest(courseId) {
        try {
            this.showLoading();
            
            const response = await this.apiRequest(
                window.API_ENDPOINTS.getMockTest,
                'GET',
                null,
                { courseId }
            );
            
            if (response.success) {
                this.currentTest = {
                    courseId: courseId,
                    questions: response.questions,
                    startTime: new Date(),
                    answers: {},
                    currentQuestion: 0
                };
                
                this.openModal('mockTestModal');
                this.initializeTest();
            } else {
                throw new Error(response.error || 'Failed to load test');
            }
            
        } catch (error) {
            console.error('Error loading mock test:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async saveTestResult(testData) {
        try {
            const response = await this.apiRequest(
                window.API_ENDPOINTS.saveTestResult,
                'POST',
                testData
            );
            
            return response.success;
            
        } catch (error) {
            console.error('Error saving test result:', error);
            return false;
        }
    }
    
    // API Utility Methods
    async apiRequest(endpoint, method = 'GET', data = null, queryParams = null) {
        try {
            // Build URL with query parameters
            let url = window.getApiUrl(endpoint);
            
            if (queryParams) {
                const queryString = new URLSearchParams(queryParams).toString();
                url += `?${queryString}`;
            }
            
            // Prepare request options
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            // Add authorization header if user is logged in
            if (this.userToken) {
                options.headers['Authorization'] = `Bearer ${this.userToken}`;
            }
            
            // Add request body for POST/PUT requests
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            // Make the request
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
    
    // UI Methods
    updateUserUI(user) {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (user) {
            // Update user info
            document.getElementById('userName').textContent = user.displayName || 'User';
            document.getElementById('userEmail').textContent = user.email;
            
            // Update avatar
            const avatar = document.getElementById('userAvatar');
            if (user.photoURL) {
                avatar.innerHTML = `<img src="${user.photoURL}" alt="User Avatar">`;
            } else {
                const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
                avatar.innerHTML = `<span>${initial}</span>`;
            }
            
            // Show/hide buttons
            userInfo.style.display = 'flex';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            
        } else {
            userInfo.style.display = 'none';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    }
    
    showAdminPanel() {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('studentDashboard').style.display = 'none';
    }
    
    showStudentDashboard() {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('studentDashboard').style.display = 'block';
    }
    
    displayCourses(courses) {
        const container = document.getElementById('coursesContainer');
        
        if (!courses || courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>No Courses Available</h3>
                    <p>Check back later for new courses!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        courses.forEach(course => {
            const isEnrolled = this.enrolledCourses.some(ec => ec.id === course.id);
            
            html += `
                <div class="course-card">
                    <div class="course-header">
                        <h3 class="course-title">${course.name}</h3>
                        <p class="course-description">${course.description || 'Comprehensive exam preparation'}</p>
                    </div>
                    <div class="course-content">
                        <ul class="features-list">
                            <li><i class="fas fa-video"></i> Video Classes</li>
                            <li><i class="fas fa-file-pdf"></i> PDF Notes</li>
                            <li><i class="fas fa-question-circle"></i> Mock Tests</li>
                            <li><i class="fas fa-newspaper"></i> Current Affairs</li>
                        </ul>
                        <div class="course-actions">
                            <button class="btn btn-primary" onclick="app.enrollInCourse('${course.id}')">
                                <i class="fas fa-plus-circle"></i> ${isEnrolled ? 'Go to Course' : 'Enroll Now'}
                            </button>
                            <button class="btn btn-secondary" onclick="app.viewCourseDetails('${course.id}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    displayStudentData(student, enrolledCourses) {
        this.enrolledCourses = enrolledCourses || [];
        
        // Update stats
        document.getElementById('enrolledCount').textContent = this.enrolledCourses.length;
        
        const totalProgress = this.enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0);
        const avgProgress = this.enrolledCourses.length > 0 ? Math.round(totalProgress / this.enrolledCourses.length) : 0;
        document.getElementById('progressPercent').textContent = `${avgProgress}%`;
        
        // Display enrolled courses
        this.displayEnrolledCourses();
    }
    
    displayEnrolledCourses() {
        const container = document.getElementById('enrolledCourses');
        
        if (!this.enrolledCourses || this.enrolledCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>No Courses Enrolled Yet</h3>
                    <p>Explore our courses and start your learning journey!</p>
                    <button class="btn btn-primary" onclick="scrollToCourses()">
                        <i class="fas fa-search"></i> Browse Courses
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        this.enrolledCourses.forEach(course => {
            html += `
                <div class="course-card">
                    <div class="course-header">
                        <h3 class="course-title">${course.name}</h3>
                        <p class="course-description">${course.description || ''}</p>
                    </div>
                    <div class="course-content">
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${course.progress || 0}%"></div>
                            </div>
                            <span class="progress-text">${course.progress || 0}% Complete</span>
                        </div>
                        <div class="course-actions">
                            <button class="btn btn-primary" onclick="app.viewCourseContent('${course.id}')">
                                <i class="fas fa-play"></i> Continue
                            </button>
                            <button class="btn btn-secondary" onclick="app.loadMockTest('${course.id}')">
                                <i class="fas fa-question-circle"></i> Take Test
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    displayStudents(students) {
        const container = document.getElementById('studentsList');
        
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="text-center">No students registered yet.</p>';
            return;
        }
        
        let html = '<h4>Registered Students</h4>';
        
        students.forEach(student => {
            const regDate = student.registeredAt ? 
                new Date(student.registeredAt).toLocaleDateString() : 'N/A';
            
            html += `
                <div class="student-card">
                    <h4>${student.fullName || 'Not Provided'}</h4>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Phone:</strong> ${student.phone || 'Not Provided'}</p>
                    <p><strong>Education:</strong> ${student.education || 'Not Provided'}</p>
                    <p><strong>Registered:</strong> ${regDate}</p>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // Mock Test UI Methods
    initializeTest() {
        if (!this.currentTest || !this.currentTest.questions) return;
        
        // Initialize timer
        this.startTestTimer();
        
        // Generate question navigation
        this.generateQuestionNavigation();
        
        // Load first question
        this.loadQuestion(0);
    }
    
    startTestTimer() {
        let timeLeft = window.TEST_CONFIG.defaultTime;
        const timerElement = document.getElementById('testTimer');
        
        // Update timer immediately
        this.updateTimerDisplay(timerElement, timeLeft);
        
        // Start countdown
        this.testTimer = setInterval(() => {
            timeLeft--;
            this.updateTimerDisplay(timerElement, timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(this.testTimer);
                this.submitTest();
            }
        }, 1000);
    }
    
    updateTimerDisplay(timerElement, seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running out
        if (seconds <= 300) { // 5 minutes
            timerElement.style.color = 'var(--danger)';
            timerElement.style.borderColor = 'var(--danger)';
        }
    }
    
    generateQuestionNavigation() {
        if (!this.currentTest) return;
        
        const container = document.getElementById('questionNav');
        const questions = this.currentTest.questions;
        
        let html = '<div class="question-nav-grid">';
        
        questions.forEach((_, index) => {
            const isAnswered = this.currentTest.answers[index] !== undefined;
            const isCurrent = index === this.currentTest.currentQuestion;
            
            let className = 'question-nav-item';
            if (isCurrent) className += ' active';
            if (isAnswered) className += ' answered';
            
            html += `
                <div class="${className}" onclick="app.loadQuestion(${index})">
                    ${index + 1}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    loadQuestion(index) {
        if (!this.currentTest || index < 0 || index >= this.currentTest.questions.length) return;
        
        this.currentTest.currentQuestion = index;
        const question = this.currentTest.questions[index];
        
        // Update question number and section
        document.getElementById('questionNumber').textContent = `Q${index + 1}`;
        document.getElementById('questionSection').textContent = question.section || '';
        
        // Update question text
        document.getElementById('questionText').textContent = question.text;
        
        // Update options
        this.updateOptions(question, index);
        
        // Update navigation
        this.updateQuestionNavigation();
    }
    
    updateOptions(question, questionIndex) {
        const container = document.getElementById('optionsContainer');
        const selectedAnswer = this.currentTest.answers[questionIndex];
        
        let html = '';
        
        question.options.forEach((option, optionIndex) => {
            const isSelected = selectedAnswer === optionIndex;
            const optionLetter = String.fromCharCode(65 + optionIndex);
            
            let className = 'option';
            if (isSelected) className += ' selected';
            
            html += `
                <div class="${className}" onclick="app.selectOption(${questionIndex}, ${optionIndex})">
                    <div class="option-letter">${optionLetter}</div>
                    <div class="option-text">${option}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateQuestionNavigation() {
        const navItems = document.querySelectorAll('.question-nav-item');
        navItems.forEach((item, index) => {
            item.classList.remove('active');
            if (index === this.currentTest.currentQuestion) {
                item.classList.add('active');
            }
        });
    }
    
    selectOption(questionIndex, optionIndex) {
        if (!this.currentTest) return;
        
        // Save answer
        this.currentTest.answers[questionIndex] = optionIndex;
        
        // Update UI
        this.updateQuestionNavigation();
        this.loadQuestion(questionIndex);
    }
    
    previousQuestion() {
        if (this.currentTest.currentQuestion > 0) {
            this.loadQuestion(this.currentTest.currentQuestion - 1);
        }
    }
    
    nextQuestion() {
        if (this.currentTest.currentQuestion < this.currentTest.questions.length - 1) {
            this.loadQuestion(this.currentTest.currentQuestion + 1);
        }
    }
    
    async submitTest() {
        if (!this.currentTest) return;
        
        // Clear timer
        clearInterval(this.testTimer);
        
        // Calculate results
        const results = this.calculateTestResults();
        
        // Save results
        const saveSuccess = await this.saveTestResult({
            courseId: this.currentTest.courseId,
            score: results.score,
            correct: results.correct,
            total: results.total,
            answers: results.answers,
            timeSpent: window.TEST_CONFIG.defaultTime - results.timeLeft
        });
        
        // Show results
        this.showTestResults(results, saveSuccess);
        
        // Close test modal
        this.closeModal('mockTestModal');
    }
    
    calculateTestResults() {
        const questions = this.currentTest.questions;
        const answers = this.currentTest.answers;
        
        let correct = 0;
        let total = questions.length;
        
        const answerDetails = [];
        
        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.answer;
            
            if (isCorrect) correct++;
            
            answerDetails.push({
                question: question.text,
                userAnswer: userAnswer !== undefined ? question.options[userAnswer] : 'Not Answered',
                correctAnswer: question.options[question.answer],
                isCorrect: isCorrect,
                explanation: question.explanation
            });
        });
        
        // Calculate score with negative marking
        const wrong = total - correct;
        const score = Math.max(0, correct - (wrong * window.TEST_CONFIG.negativeMarking));
        const percentage = Math.round((score / total) * 100);
        
        return {
            score: percentage,
            correct: correct,
            total: total,
            wrong: wrong,
            answers: answerDetails,
            timeLeft: this.getRemainingTime()
        };
    }
    
    getRemainingTime() {
        const timerElement = document.getElementById('testTimer');
        const timeText = timerElement.textContent;
        const [minutes, seconds] = timeText.split(':').map(Number);
        return minutes * 60 + seconds;
    }
    
    showTestResults(results, saveSuccess) {
        const container = document.getElementById('testResults');
        
        let html = `
            <div class="score-display">
                <div class="score-circle">
                    <div class="score-value">${results.score}%</div>
                </div>
                <h3>Test Completed!</h3>
                <p>${saveSuccess ? 'Results saved successfully!' : 'Results not saved'}</p>
            </div>
            
            <div class="result-stats">
                <div class="stat-item">
                    <div class="stat-value">${results.correct}</div>
                    <div class="stat-label">Correct Answers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${results.wrong}</div>
                    <div class="stat-label">Wrong Answers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${results.total}</div>
                    <div class="stat-label">Total Questions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round(results.score)}</div>
                    <div class="stat-label">Final Score</div>
                </div>
            </div>
            
            <div class="result-actions">
                <button class="btn btn-primary" onclick="app.reviewTestAnswers()">
                    <i class="fas fa-chart-bar"></i> Review Answers
                </button>
                <button class="btn btn-secondary" onclick="closeModal('resultsModal')">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        container.innerHTML = html;
        this.openModal('resultsModal');
    }
    
    // Utility Methods
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
    
    showError(message) {
        alert(`Error: ${message}`);
    }
    
    showSuccess(message) {
        alert(`Success: ${message}`);
    }
    
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    async loadInitialData() {
        // Load courses for all users
        await this.loadCourses();
        
        // Load additional data based on user role
        if (this.currentUser) {
            if (this.isAdmin) {
                await this.loadAdminData();
            } else {
                await this.loadStudentData();
            }
        }
    }
    
    // Event Handlers
    async handleRegistrationSubmit(event) {
        event.preventDefault();
        
        const studentData = {
            fullName: document.getElementById('fullName').value,
            dob: document.getElementById('dob').value,
            phone: document.getElementById('phone').value,
            education: document.getElementById('education').value
        };
        
        await this.registerStudent(studentData);
    }
    
    async handleAddCourse() {
        const courseData = {
            name: document.getElementById('courseName').value,
            description: document.getElementById('courseDescription').value
        };
        
        if (!courseData.name || !courseData.description) {
            this.showError('Please fill in all fields');
            return;
        }
        
        await this.addCourse(courseData);
    }
    
    async handleAddBanner() {
        const bannerData = {
            title: document.getElementById('bannerTitle').value,
            description: document.getElementById('bannerDescription').value
        };
        
        if (!bannerData.title || !bannerData.description) {
            this.showError('Please fill in all fields');
            return;
        }
        
        await this.addBanner(bannerData);
    }
    
    async handleLogoUpload() {
        const fileInput = document.getElementById('logoUpload');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showError('Please select a file');
            return;
        }
        
        // Check file size
        if (file.size > window.APP_CONFIG.maxFileSize) {
            this.showError('File size must be less than 10MB');
            return;
        }
        
        // Check file type
        if (!window.APP_CONFIG.allowedFileTypes.includes(file.type)) {
            this.showError('Only image files are allowed (JPEG, PNG, GIF)');
            return;
        }
        
        // Upload logo (in a real app, this would upload to Firebase Storage)
        try {
            this.showLoading();
            
            // For demo purposes, we'll just update the preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('siteLogo').src = e.target.result;
                this.showSuccess('Logo updated successfully!');
                fileInput.value = '';
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Logo upload error:', error);
            this.showError('Failed to upload logo');
        } finally {
            this.hideLoading();
        }
    }
    
    // Navigation Methods
    viewCourseDetails(courseId) {
        const course = this.enrolledCourses.find(c => c.id === courseId) || 
                      this.getCourseById(courseId);
        
        if (course) {
            document.getElementById('modalCourseTitle').textContent = course.name;
            this.openModal('courseContentModal');
        }
    }
    
    viewCourseContent(courseId) {
        this.viewCourseDetails(courseId);
    }
    
    getCourseById(courseId) {
        // This would normally fetch from the API
        return null;
    }
    
    reviewTestAnswers() {
        // Implement review functionality
        this.showInfo('Review feature coming soon!');
    }
    
    showInfo(message) {
        alert(`Info: ${message}`);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new OdigyanApp();
    
    // Setup event listeners
    document.getElementById('loginBtn').addEventListener('click', () => {
        window.app.signInWithGoogle();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.app.signOut();
    });
    
    document.getElementById('registrationForm').addEventListener('submit', (e) => {
        window.app.handleRegistrationSubmit(e);
    });
    
    // Add course button
    const addCourseBtn = document.querySelector('button[onclick*="addCourse"]');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => {
            window.app.handleAddCourse();
        });
    }
    
    // Add banner button
    const addBannerBtn = document.querySelector('button[onclick*="addBanner"]');
    if (addBannerBtn) {
        addBannerBtn.addEventListener('click', () => {
            window.app.handleAddBanner();
        });
    }
    
    // Logo upload button
    const logoUploadBtn = document.querySelector('button[onclick*="uploadLogo"]');
    if (logoUploadBtn) {
        logoUploadBtn.addEventListener('click', () => {
            window.app.handleLogoUpload();
        });
    }
    
    console.log('Odigyan App Initialized');
});
