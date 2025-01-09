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

function showFlashMessage(message, isError = false) {
  const flashMessageDiv = document.getElementById('flashMessage');
  flashMessageDiv.textContent = message;
  flashMessageDiv.className = isError ? 'flash-message error' : 'flash-message success';
  flashMessageDiv.style.display = 'block';
  setTimeout(() => {
    flashMessageDiv.style.display = 'none';
  }, 3000); // Duration set to 3 seconds
}

function displayFlashMessageFromSession() {
  const message = sessionStorage.getItem('flashMessage');
  const messageType = sessionStorage.getItem('flashMessageType');
  if (message) {
    showFlashMessage(message, messageType === 'error');
    sessionStorage.removeItem('flashMessage');
    sessionStorage.removeItem('flashMessageType');
  }
}

window.saveText = function() {
  const userText = document.getElementById('userInput').value;
  const textKey = document.getElementById('userInput').dataset.key; // Get the key if editing
  const user = getAuth().currentUser;
  
  if (user) {
    const userUid = user.uid;
    const textsRef = ref(database, `texts/${userUid}`);

    if (textKey) {
      update(ref(database, `texts/${userUid}/${textKey}`), { content: userText })
        .then(() => {
          document.getElementById('userInput').value = '';
          document.getElementById('userInput').dataset.key = ''; // Clear the key after editing
          displayText();
          showFlashMessage('Text updated successfully!');
        })
        .catch(error => {
          showFlashMessage('Error updating the text.', true);
        });
    } else {
      push(textsRef, { content: userText })
        .then(() => {
          document.getElementById('userInput').value = ''; // Clear input after saving
          displayText(); // Display user-specific text
          showFlashMessage('Text saved successfully!');
        })
        .catch(error => {
          showFlashMessage('Error saving the text.', true);
        });
    }
  } else {
    showFlashMessage("User not authenticated.", true);
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

      textsArray.reverse().forEach((data) => {
        const textKey = data.key;

        const childDiv = document.createElement('div');
        childDiv.className = 'text-entry';

        const textSpan = document.createElement('span');
        const lines = data.content.split('\n');
        const previewText = lines.slice(0, 10).join('\n');
        const isTruncated = lines.length > 10;
        textSpan.textContent = isTruncated ? `${previewText}\n...` : data.content;

        const viewMoreButton = document.createElement('button');
        viewMoreButton.textContent = 'Show more';
        viewMoreButton.className = 'view-more-button';
        viewMoreButton.style.display = isTruncated ? 'inline' : 'none';
        viewMoreButton.onclick = function() {
          if (viewMoreButton.textContent === 'Show more') {
            textSpan.textContent = data.content;
            viewMoreButton.textContent = 'Show less';
          } else {
            textSpan.textContent = `${previewText}\n...`;
            viewMoreButton.textContent = 'Show more';
          }
        };

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const copyButton = document.createElement('button');
        copyButton.innerHTML = '📋';
        copyButton.className = 'copy-button';
        copyButton.onclick = function() {
          navigator.clipboard.writeText(data.content)
            .then(() => showFlashMessage("Text copied!"))
            .catch(() => {
              showFlashMessage("Error copying text.", true);
            });
        };

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = function() {
          remove(ref(database, `texts/${userUid}/${textKey}`))
            .then(() => {
              showFlashMessage("Text deleted successfully!");
            })
            .catch(() => {
              showFlashMessage("Error deleting text.", true);
            });
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
        childDiv.appendChild(viewMoreButton);
        childDiv.appendChild(iconContainer);
        displayDiv.appendChild(childDiv);
      });
    });
  } else {
    showFlashMessage("User not authenticated.", true);
  }
};

window.displayUserInfo = function(user) {
  document.getElementById('userEmail').innerHTML = `Hi ${user.email}!<br>Welcome to the main App`;
};

window.signOutUser = function() {
  signOut(auth).then(() => {
    redirectToPageWithMessage("../index.html", "Signed out successfully!");
  }).catch((error) => {
    showFlashMessage("Error signing out.", true);
  });
};

function redirectToPageWithMessage(url, message, isError = false) {
  sessionStorage.setItem('flashMessage', message);
  sessionStorage.setItem('flashMessageType', isError ? 'error' : 'success');
  window.location.href = url;
}

displayFlashMessageFromSession();
