import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const database = getDatabase(app);
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../index.html";
  } else {
    displayText();
    displayUserInfo(user);
  }
});

window.saveText = function() {
  const userText = document.getElementById('userInput').value;
  const textKey = document.getElementById('userInput').dataset.key; // Get the key if editing
  const user = getAuth().currentUser;
  
  if (user) {
    const userUid = user.uid;
    const textsRef = ref(database, `texts/${userUid}`);

    if (textKey) {
      // If we are editing an existing entry, update it
      update(ref(database, `texts/${userUid}/${textKey}`), { content: userText })
        .then(() => {
          console.log('Text updated!');
          document.getElementById('userInput').value = '';
          document.getElementById('userInput').dataset.key = ''; // Clear the key after editing
          displayText();
        })
        .catch(error => console.error('Error updating the text:', error));
    } else {
      // If it's a new entry, push it to the database
      push(textsRef, { content: userText })
        .then(() => {
          console.log('Text saved!');
          document.getElementById('userInput').value = ''; // Clear input after saving
          displayText(); // Display user-specific text
        })
        .catch(error => console.error('Error writing to database:', error));
    }
  } else {
    alert("User not authenticated.");
  }
};

window.displayText = function() {
  const user = getAuth().currentUser;
  
  if (user) {
    const userUid = user.uid;
    const displayDiv = document.getElementById('displayText');
    const textsRef = ref(database, `texts/${userUid}`);
    
    onValue(textsRef, (snapshot) => {
      displayDiv.innerHTML = ''; // Clear the display area first
      const textsArray = [];
      snapshot.forEach(childSnapshot => {
        textsArray.push({ key: childSnapshot.key, ...childSnapshot.val() });
      });

      // Reverse the order to show latest entry at the top
      textsArray.reverse().forEach((data) => {
        const textKey = data.key;

        const childDiv = document.createElement('div');
        childDiv.className = 'text-entry';

        const textSpan = document.createElement('span');
        textSpan.textContent = data.content;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const copyButton = document.createElement('button');
        copyButton.innerHTML = '📋';
        copyButton.className = 'copy-button';
        copyButton.onclick = function() {
          navigator.clipboard.writeText(data.content)
            .then(() => alert("Text copied!"))
            .catch(err => console.error("Error copying text:", err));
        };

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = function() {
          remove(ref(database, `texts/${userUid}/${textKey}`))
            .then(() => console.log("Text deleted!"))
            .catch(error => console.error("Error deleting text:", error));
        };

        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️'; // Unicode for pencil icon
        editButton.className = 'edit-button';
        editButton.onclick = function() {
          document.getElementById('userInput').value = data.content;
          document.getElementById('userInput').dataset.key = textKey; // Store the key in the input field for editing
        };

        iconContainer.appendChild(copyButton);
        iconContainer.appendChild(deleteButton);
        iconContainer.appendChild(editButton);

        childDiv.appendChild(textSpan);
        childDiv.appendChild(iconContainer);
        displayDiv.appendChild(childDiv);
      });
    });
  } else {
    alert("User not authenticated.");
  }
};

window.displayUserInfo = function(user) {
  document.getElementById('userEmail').innerHTML = `Hi ${user.email}!<br>Welcome to the main App`;
};

window.signOutUser = function() {
  signOut(auth).then(() => {
    alert("Signed out successfully!");
    window.location.href = "../index.html";
  }).catch((error) => {
    console.error("Error signing out:", error);
  });
};
