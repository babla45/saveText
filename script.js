    
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

    // Sign in function
    window.signIn = function() {
      const email = document.getElementById('emailInput').value;
      const password = document.getElementById('passwordInput').value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Redirect to the main app page after successful sign-in
          window.location.href = "main/main.html";
        })
        .catch((error) => {
          const errorMessage = error.message;
          console.error("Error signing in:", errorMessage);
          alert(`Error signing in: ${errorMessage}`);
        });
    };

    // Check if user is already signed in
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "main/main.html"; // Redirect to main page if already signed in
      }
    });
