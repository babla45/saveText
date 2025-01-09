// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADeJi7Qnvdxyel_DDiQlU39N2htEi9xCU",
  authDomain: "savetextwebapp.firebaseapp.com",
  databaseURL: "https://savetextwebapp-default-rtdb.firebaseio.com",
  projectId: "savetextwebapp",
  storageBucket: "savetextwebapp.appspot.com",
  messagingSenderId: "1091844674985",
  appId: "1:1091844674985:web:0c4edde3484433df6160b8",
  measurementId: "G-C4FD899SCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

function showFlashMessage(message, isError = false) {
  const flashMessageDiv = document.getElementById('flashMessage');
  flashMessageDiv.textContent = message;
  flashMessageDiv.className = isError ? 'flash-message error' : 'flash-message success';
  flashMessageDiv.style.display = 'block';
  setTimeout(() => {
    flashMessageDiv.style.display = 'none';
  }, 3000); // Duration set to 3 seconds
}

function redirectToPageWithMessage(url, message, isError = false) {
  sessionStorage.setItem('flashMessage', message);
  sessionStorage.setItem('flashMessageType', isError ? 'error' : 'success');
  window.location.href = url;
}

// Sign in function
window.signIn = function() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      redirectToPageWithMessage("main/main.html", "Logged in successfully!");
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Error signing in:", errorMessage);
      showFlashMessage(`Error signing in: ${errorMessage}`, true);
    });
};

// View as guest function
window.viewAsGuest = function() {
  const email = "public@gmail.com";
  const password = "123456"; // Use a predefined password for the public account

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      redirectToPageWithMessage("main/main.html", "Logged in as guest!");
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Error signing in as guest:", errorMessage);
      showFlashMessage(`Error signing in as guest: ${errorMessage}`, true);
    });
};

// Check if user is already signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    redirectToPageWithMessage("main/main.html", "Signed in successfully!");
  }
});
