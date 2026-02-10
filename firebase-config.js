// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQjcpID_OowVF6BIkbHS38URhvrbdsyM",
    authDomain: "odigyan-56dc4.firebaseapp.com",
    projectId: "odigyan-56dc4",
    storageBucket: "odigyan-56dc4.firebasestorage.app",
    messagingSenderId: "11985535136",
    appId: "1:11985535136:web:2e5f6fa1bc5c55656c09c5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        checkUserRegistration(user);
    } else {
        currentUser = null;
        updateUIForLogout();
    }
});

// Handle Authentication
function handleAuth() {
    if (!currentUser) {
        auth.signInWithPopup(provider)
            .then((result) => {
                // User signed in
            })
            .catch((error) => {
                console.error('Auth error:', error);
                alert('Error during login. Please try again.');
            });
    } else {
        // User is already logged in
        if (currentUser.email === 'bimbadharbaghel0@gmail.com') {
            window.location.href = 'admin.html';
        } else {
            // Show user options
        }
    }
}

// Check if user is registered
async function checkUserRegistration(user) {
    try {
        const doc = await db.collection('students').doc(user.uid).get();
        if (doc.exists) {
            updateUIAfterLogin(user);
        } else {
            showRegistrationModal();
        }
    } catch (error) {
        console.error('Error checking registration:', error);
        showRegistrationModal();
    }
}

// Update UI after login
function updateUIAfterLogin(user) {
    document.getElementById('authBtn').style.display = 'none';
    document.getElementById('userProfile').style.display = 'flex';
    document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('userPhoto').src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
}

// Update UI for logout
function updateUIForLogout() {
    document.getElementById('authBtn').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
}

// Logout function
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}
