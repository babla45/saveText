import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth();

window.signUp = function() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Sign up successful! Please sign in.");
      window.location.href = "index.html"; // Redirect to sign-in page
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Error signing up:", errorMessage);
      alert(`Error signing up: ${errorMessage}`);
    });
};
