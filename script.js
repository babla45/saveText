<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firebase and GitHub Pages Example</title>
  <!-- Include Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.x/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.x/firebase-firestore.js"></script>
</head>
<body>
  <input type="text" id="userInput" placeholder="Enter text here">
  <button onclick="saveText()">Save Text</button>
  <div id="displayText"></div>

  <script>
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


    // -------------------



    // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



// Initialize Firebase
// const analytics = getAnalytics(app);

    // -------------------

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Save user input to Firebase
    function saveText() {
      const userText = document.getElementById('userInput').value;
      db.collection('texts').add({ content: userText })
        .then(() => {
          console.log('Text saved!');
          displayText();
        })
        .catch(error => console.error('Error writing document: ', error));
    }

    // Display saved text from Firebase
    function displayText() {
      db.collection('texts').get().then(querySnapshot => {
        const displayDiv = document.getElementById('displayText');
        displayDiv.innerHTML = '';
        querySnapshot.forEach(doc => {
          displayDiv.innerHTML += `<p>${doc.data().content}</p>`;
        });
      });
    }

    // Initial fetch of data
    displayText();
  </script>
</body>
</html>
