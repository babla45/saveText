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

window.allTextsArray = []; // Store fetched texts globally for searching
window.filteredTextsArray = [];

// Helper function to check if query is a subsequence of string
function isSubsequence(query, string) {
  if (query.length === 0) return true;
  let qIdx = 0;
  for (let sIdx = 0; sIdx < string.length; sIdx++) {
    if (string[sIdx].toLowerCase() === query[qIdx].toLowerCase()) {
      qIdx++;
      if (qIdx === query.length) return true;
    }
  }
  return false;
}

function doesTextMatchQuery(text, query, searchType) {
  if (!query) return true;

  if (searchType === 'substring') {
    return text.toLowerCase().includes(query.toLowerCase());
  }

  if (searchType === 'fullword') {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
    return regex.test(text);
  }

  if (searchType === 'regex') {
    try {
      const regex = new RegExp(query, 'i');
      return regex.test(text);
    } catch (e) {
      return false;
    }
  }

  return isSubsequence(query, text);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
}

function highlightText(text, query, type) {
  if (!query) return escapeHTML(text).replace(/\n/g, '<br>');

  if (type === 'regex') {
    try {
      if (new RegExp(query).test('')) {
        return escapeHTML(text).replace(/\n/g, '<br>'); // Prevent infinite empty match
      }
      const matchRegex = new RegExp("(" + query + ")", "gi");
      const parts = text.split(matchRegex);
      return parts.map((part, i) => {
        if (i % 2 === 1 && part) {
          return `<mark style="background-color: yellow;">${escapeHTML(part).replace(/\n/g, '<br>')}</mark>`;
        }
        return escapeHTML(part).replace(/\n/g, '<br>');
      }).join('');
    } catch(e) {
      return escapeHTML(text).replace(/\n/g, '<br>');
    }
  }

  if (type === 'substring' || type === 'fullword') {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = type === 'fullword' ? `(\\b${escapedQuery}\\b)` : `(${escapedQuery})`;
    const regex = new RegExp(regexPattern, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (i % 2 === 1 && part) {
        return `<mark style="background-color: yellow;">${escapeHTML(part).replace(/\n/g, '<br>')}</mark>`;
      }
      return escapeHTML(part).replace(/\n/g, '<br>');
    }).join('');
  } else if (type === 'subsequence') {
    let qIdx = 0;
    let result = '';
    const rawQuery = query.toLowerCase();
    for (let i = 0; i < text.length; i++) {
      if (qIdx < rawQuery.length && text[i].toLowerCase() === rawQuery[qIdx]) {
        result += `<mark style="background-color: yellow;">${escapeHTML(text[i]).replace(/\n/g, '<br>')}</mark>`;
        qIdx++;
      } else {
        result += escapeHTML(text[i]).replace(/\n/g, '<br>');
      }
    }
    return result;
  }
}

// Function to render texts specifically
window.renderTexts = function() {
  const displayDiv = document.getElementById('displayText');
  displayDiv.innerHTML = ''; // Clear current display
  const user = getAuth().currentUser;
  if (!user) return;
  const userUid = user.uid;

  const query = document.getElementById('searchInput').value.trim();
  const searchType = document.getElementById('searchType').value;
  const searchResultsCount = document.getElementById('searchResultsCount');
  const userInput = document.getElementById('userInput');
  const editorText = userInput ? userInput.value : '';
  const editorHasMatch = query !== '' && editorText !== '' && doesTextMatchQuery(editorText, query, searchType);

  if (query !== '') {
    const totalResults = window.filteredTextsArray.length + (editorHasMatch ? 1 : 0);
    searchResultsCount.textContent = `(${totalResults} results found)`;
  } else {
    searchResultsCount.textContent = '';
  }

  if (editorHasMatch) {
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'text-entry border-l-4 border-blue-500 bg-blue-50/50';

    const editorTitle = document.createElement('div');
    editorTitle.className = 'text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide';
    editorTitle.textContent = 'Current Note (Editor)';

    const editorContent = document.createElement('div');
    editorContent.innerHTML = highlightText(editorText, query, searchType);

    editorWrapper.appendChild(editorTitle);
    editorWrapper.appendChild(editorContent);
    displayDiv.appendChild(editorWrapper);
  }

  if (window.filteredTextsArray.length === 0 && !editorHasMatch) {
    if (query !== '') {
      displayDiv.innerHTML = '<div class="text-center text-gray-500 py-8 italic border-t border-gray-200">No matching notes found.</div>';
    }
    return;
  }

  window.filteredTextsArray.forEach((data, index) => {
    const textKey = data.key;

    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'flex items-start sm:items-center mt-2 sm:mt-0';

    const indexNumber = document.createElement('div');
    indexNumber.className = 'text-gray-400 font-bold text-sm sm:text-lg w-6 sm:w-8 flex-shrink-0 text-right mr-2 sm:mr-4 mt-2 sm:mt-0';
    indexNumber.textContent = `${index + 1}.`;

    const childDiv = document.createElement('div');
    childDiv.className = 'text-entry flex-grow';
    childDiv.style.margin = '0'; // Override existing margin to fit nicely in flex row

    const textSpan = document.createElement('span');
    const lines = data.content.split('\n');
    const previewRaw = lines.slice(0, 10).join('\n');
    const isTruncated = lines.length > 10;
    
    textSpan.innerHTML = isTruncated 
      ? highlightText(previewRaw, query, searchType) + '<br>...'
      : highlightText(data.content, query, searchType);

    const viewMoreButton = document.createElement('button');
    viewMoreButton.textContent = 'Show more';
    viewMoreButton.className = 'view-more-button';
    viewMoreButton.style.display = isTruncated ? 'inline' : 'none';
    viewMoreButton.onclick = function() {
      if (viewMoreButton.textContent === 'Show more') {
        textSpan.innerHTML = highlightText(data.content, query, searchType);
        viewMoreButton.textContent = 'Show less';
      } else {
        textSpan.innerHTML = highlightText(previewRaw, query, searchType) + '<br>...';
        viewMoreButton.textContent = 'Show more';
      }
      window.updateSearchNavigation(true);
    };

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'action-text-btn';
    copyButton.onclick = function() {
      navigator.clipboard.writeText(data.content)
        .then(() => showFlashMessage("Text copied!"))
        .catch(() => {
          showFlashMessage("Error copying text.", true);
        });
    };

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'action-text-btn';
    editButton.onclick = function() {
      const userInputEl = document.getElementById('userInput');
      userInputEl.value = data.content;
      userInputEl.dataset.key = textKey; // Store the key in the input field for editing
      
      // Scroll to the input and focus it
      const y = userInputEl.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({top: y, behavior: 'smooth'});
      userInputEl.focus({ preventScroll: true });
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'action-text-btn delete-text-btn';
    deleteButton.onclick = function() {
      if (confirm("Are you sure you want to delete this text?")) {
        remove(ref(database, `texts/${userUid}/${textKey}`))
          .then(() => {
            showFlashMessage("Text deleted successfully!");
          })
          .catch(() => {
            showFlashMessage("Error deleting text.", true);
          });
      }
    };

    actionsContainer.appendChild(copyButton);
    actionsContainer.appendChild(editButton);
    actionsContainer.appendChild(deleteButton);

    childDiv.appendChild(textSpan);
    if (isTruncated) {
      childDiv.appendChild(viewMoreButton);
    }
    childDiv.appendChild(actionsContainer);

    rowWrapper.appendChild(indexNumber);
    rowWrapper.appendChild(childDiv);
    displayDiv.appendChild(rowWrapper);
  });
  
  // Update search navigation arrows and count
  window.updateSearchNavigation(false);
};

// Search Result Navigation state
window.currentSearchIndex = -1;
window.searchResults = [];

window.updateSearchNavigation = function(preserveIndex = false) {
  window.searchResults = Array.from(document.querySelectorAll('mark'));
  const searchControls = document.getElementById('searchNavControls');
  const searchInput = document.getElementById('searchInput').value.trim();
  
  if (searchControls) {
    if (window.searchResults.length > 0 && searchInput !== '') {
      searchControls.classList.remove('hidden');
      if (!preserveIndex || window.currentSearchIndex >= window.searchResults.length || window.currentSearchIndex < 0) {
        window.currentSearchIndex = 0;
      }
      window.highlightCurrentResult(false); // Don't scroll while typing/searching
    } else {
      searchControls.classList.add('hidden');
      window.currentSearchIndex = -1;
      const countEl = document.getElementById('searchNavCount');
      if (countEl) countEl.textContent = '0/0';
    }
  }
};

window.highlightCurrentResult = function(scroll = true) {
  window.searchResults.forEach((el, index) => {
    if (index === window.currentSearchIndex) {
      el.style.backgroundColor = '#ff9800'; // Orange to indicate active
      el.style.color = '#fff';
      
      // Smooth scroll into view, accounting for sticking nav height (~64px)
      if (scroll) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    } else {
      el.style.backgroundColor = 'yellow';
      el.style.color = '';
    }
  });

  const countEl = document.getElementById('searchNavCount');
  if (countEl) {
    countEl.textContent = `${window.currentSearchIndex + 1}/${window.searchResults.length}`;
  }
};

window.nextSearchResult = function() {
  if (window.searchResults.length === 0) return;
  window.currentSearchIndex = (window.currentSearchIndex + 1) % window.searchResults.length;
  window.highlightCurrentResult(true);
};

window.prevSearchResult = function() {
  if (window.searchResults.length === 0) return;
  window.currentSearchIndex = (window.currentSearchIndex - 1 + window.searchResults.length) % window.searchResults.length;
  window.highlightCurrentResult(true);
};

// Search handling function
window.handleSearch = function() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const searchTypeSelect = document.getElementById('searchType');
  const replaceEditorGroup = document.getElementById('replaceEditorGroup');
  const userInput = document.getElementById('userInput');
  const query = searchInput.value;
  const searchType = searchTypeSelect.value;
  
  // Show/hide clear button and search type select
  if (query.length > 0) {
    clearBtn.classList.remove('hidden');
    searchTypeSelect.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
    searchTypeSelect.classList.add('hidden');
  }

  const queryTrimmed = query.trim();
  const editorText = userInput ? userInput.value : '';
  const editorHasMatch = queryTrimmed !== '' && editorText !== '' && doesTextMatchQuery(editorText, queryTrimmed, searchType);

  if (replaceEditorGroup) {
    if (editorHasMatch) {
      replaceEditorGroup.classList.remove('hidden');
    } else {
      replaceEditorGroup.classList.add('hidden');
    }
  }
  
  if (queryTrimmed === '') {
    window.filteredTextsArray = [...window.allTextsArray];
  } else {
    window.filteredTextsArray = window.allTextsArray.filter(data => {
      const text = data.content;
      return doesTextMatchQuery(text, queryTrimmed, searchType);
    });
  }
  window.renderTexts();
};

window.clearSearch = function() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  window.handleSearch();
};

window.replaceFoundInCurrentEditorNote = function() {
  const searchInput = document.getElementById('searchInput');
  const searchTypeSelect = document.getElementById('searchType');
  const replaceInput = document.getElementById('replaceInput');
  const userInput = document.getElementById('userInput');

  const query = searchInput.value.trim();
  const searchType = searchTypeSelect.value;
  const replacement = replaceInput.value;
  const currentText = userInput.value;

  if (!query) {
    showFlashMessage('Enter text in the top search box first.', true);
    return;
  }

  if (searchType === 'subsequence') {
    showFlashMessage('Replace is not supported for Subseq mode. Use Substr, Full Word, or Regex.', true);
    return;
  }

  let regex;
  try {
    if (searchType === 'substring') {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escapedQuery, 'gi');
    } else if (searchType === 'fullword') {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(`\\b${escapedQuery}\\b`, 'gi');
    } else {
      if (new RegExp(query).test('')) {
        showFlashMessage('Regex matches empty text; replace is blocked to avoid unintended changes.', true);
        return;
      }
      regex = new RegExp(query, 'gi');
    }
  } catch (e) {
    showFlashMessage('Invalid regex pattern.', true);
    return;
  }

  const matchRegex = new RegExp(regex.source, regex.flags);
  const matches = Array.from(currentText.matchAll(matchRegex));
  const replacedCount = matches.length;

  if (replacedCount === 0) {
    showFlashMessage('No matches found in current note.', true);
    return;
  }

  let replacementValue = replacement;
  if (searchType === 'regex') {
    // Support $0 as full-match token (mapped to JS $&). Use \$0 for a literal "$0".
    replacementValue = replacementValue
      .replace(/\\\$0/g, '__LITERAL_DOLLAR_ZERO__')
      .replace(/(^|[^\\])\$0(?!\d)/g, (full, prefix) => `${prefix}$&`)
      .replace(/__LITERAL_DOLLAR_ZERO__/g, '$0');
  }

  userInput.value = currentText.replace(regex, replacementValue);
  window.handleSearch();
  showFlashMessage(`Replaced ${replacedCount} occurrence${replacedCount === 1 ? '' : 's'} in current note.`);
};

window.toggleSettingsMenu = function() {
  const dropdown = document.getElementById('settingsDropdown');
  dropdown.classList.toggle('hidden');
};

window.expandAllNotes = function() {
  document.querySelectorAll('.view-more-button').forEach(btn => {
    if (btn.style.display !== 'none' && btn.textContent === 'Show more') {
      btn.click();
    }
  });
  document.getElementById('settingsDropdown').classList.add('hidden');
};

window.collapseAllNotes = function() {
  document.querySelectorAll('.view-more-button').forEach(btn => {
    if (btn.style.display !== 'none' && btn.textContent === 'Show less') {
      btn.click();
    }
  });
  document.getElementById('settingsDropdown').classList.add('hidden');
};

// Close dropdown if clicked outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('settingsDropdown');
  const button = document.getElementById('settingsMenuButton');
  if (!dropdown.contains(event.target) && !button.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
});

window.displayText = function() {
  const user = getAuth().currentUser;
  
  if (user) {
    const userUid = user.uid;
    const displayDiv = document.getElementById('displayText');
    const textsRef = ref(database, `texts/${userUid}`);
    
    displayDiv.innerHTML = '<div class="loading-indicator">Loading notes...</div>';

    onValue(textsRef, (snapshot) => {
      const textsArray = [];
      snapshot.forEach(childSnapshot => {
        textsArray.push({ key: childSnapshot.key, ...childSnapshot.val() });
      });

      window.allTextsArray = textsArray.reverse();
      
      // Preserve search filter on update
      window.handleSearch();
    });
  } else {
    showFlashMessage("User not authenticated.", true);
  }
};

window.displayUserInfo = function(user) {
  document.getElementById('userEmail').innerHTML = `User: ${user.email}`;
};

window.signOutUser = function() {
  signOut(auth).then(() => {
    window.location.href = "../index.html";
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
