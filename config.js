// Backend API Configuration
window.API_BASE_URL = 'https://odigyan-backend.vercel.app';

// Firebase Configuration
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyDXQjcpID_OowVF6BIkbHS38URhvrbdsyM",
    authDomain: "odigyan-56dc4.firebaseapp.com",
    projectId: "odigyan-56dc4",
    storageBucket: "odigyan-56dc4.firebasestorage.app",
    messagingSenderId: "11985535136",
    appId: "1:11985535136:web:2e5f6fa1bc5c55656c09c5"
};

// Telegram Configuration
window.TELEGRAM_CONFIG = {
    botToken: "7968223949:AAEkZh0_A2ACrmcOqO7hhWuAnq6gOnsvxNo",
    channelId: "-1003710322105",
    channelLink: "https://t.me/+ZBd1U67Q8nY2NDhl",
    publicLink: "https://t.me/Odigyan"
};

// Admin Configuration
window.ADMIN_CONFIG = {
    adminEmail: "bimbadharbaghel0@gmail.com",
    allowedDomains: ["gmail.com", "yahoo.com", "outlook.com"]
};

// Application Configuration
window.APP_CONFIG = {
    appName: "Odigyan",
    version: "1.0.0",
    supportEmail: "support@odigyan.in",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4']
};

// Mock Test Configuration
window.TEST_CONFIG = {
    defaultTime: 1800, // 30 minutes in seconds
    negativeMarking: 0.25, // -0.25 for wrong answer
    questionsPerTest: 20,
    sections: ["Physics", "Chemistry", "Mathematics", "General Knowledge"]
};

// Local Storage Keys
window.STORAGE_KEYS = {
    userData: 'odigyan_user_data',
    authToken: 'odigyan_auth_token',
    enrolledCourses: 'odigyan_enrolled_courses',
    testProgress: 'odigyan_test_progress'
};

// API Endpoints
window.API_ENDPOINTS = {
    // Courses
    getCourses: '/api/courses',
    enrollCourse: '/api/courses/enroll',
    
    // Students
    registerStudent: '/api/students/register',
    getStudent: '/api/students',
    saveTestResult: '/api/students/test-result',
    
    // Telegram
    getTelegramFiles: '/api/telegram/files',
    getMockTest: '/api/telegram/mocktest',
    
    // Admin
    getStudents: '/api/admin/students',
    addCourse: '/api/admin/courses',
    addBanner: '/api/admin/banners',
    
    // Auth
    verifyAuth: '/api/auth'
};

// Utility function to get API URL
window.getApiUrl = function(endpoint) {
    return window.API_BASE_URL + endpoint;
};

// Initialize configuration
console.log('Odigyan Configuration Loaded');
console.log('API Base URL:', window.API_BASE_URL);
console.log('App Name:', window.APP_CONFIG.appName);
console.log('Version:', window.APP_CONFIG.version);
