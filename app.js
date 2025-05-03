// API Configuration
const API_URL = "https://final-project-w0723869.onrender.com/api"// url to render

// DOM Elements
const createBtn = document.getElementById('createBtn');
const getBtn = document.getElementById('getBtn');
const deleteBtn = document.getElementById('deleteBtn');
const itemNameInput = document.getElementById('itemName');
const itemDescriptionInput = document.getElementById('itemDescription');
const deleteIdInput = document.getElementById('deleteId');
const createResult = document.getElementById('createResult');
const getResult = document.getElementById('getResult');
const itemsList = document.getElementById('itemsList');
const deleteResult = document.getElementById('deleteResult');
const apiStatus = document.getElementById('apiStatus');
const statusText = document.getElementById('statusText');
const requestLog = document.getElementById('requestLog');

// Helper Functions
function logRequest(method, url, status, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry');
    
    const statusColor = status >= 200 && status < 300 ? 'green' : 'red';
    
    logEntry.innerHTML = `
        <strong>${timestamp}</strong> - 
        <span style="color: blue">${method}</span> ${url} - 
        <span style="color: ${statusColor}">Status: ${status}</span> - 
        ${message}
    `;
    
    requestLog.prepend(logEntry);
    
    // Keep only the latest 10 entries
    if (requestLog.children.length > 10) {
        requestLog.removeChild(requestLog.lastChild);
    }
}

function showResult(element, message, isSuccess = true) {
    element.textContent = message;
    element.className = 'result';
    element.classList.add(isSuccess ? 'success' : 'error');
}

// API Functions
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        if (response.ok) {
            apiStatus.className = 'status-indicator online';
            statusText.textContent = 'API Connected (200 OK)';
        } else {
            throw new Error(`API responded with status: ${response.status}`);
        }
    } catch (error) {
        apiStatus.className = 'status-indicator offline';
        statusText.textContent = `API Disconnected: ${error.message}`;
    }
}

async function createItem() {
    const name = itemNameInput.value.trim();
    const description = itemDescriptionInput.value.trim();
    
    if (!name) {
        showResult(createResult, 'Name is required!', false);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult(createResult, `Item created successfully! ID: ${data.id}`);
            logRequest('POST', `${API_URL}/items`, response.status, 'Item created successfully');
            
            // Clear the form
            itemNameInput.value = '';
            itemDescriptionInput.value = '';
            
            // Refresh the items list
            getItems();
        } else {
            throw new Error(data.message || 'Failed to create item');
        }
    } catch (error) {
        showResult(createResult, `Error: ${error.message}`, false);
        logRequest('POST', `${API_URL}/items`, 500, error.message);
    }
}

async function getItems() {
    try {
        const response = await fetch(`${API_URL}/items`);
        const data = await response.json();
        
        if (response.ok) {
            logRequest('GET', `${API_URL}/items`, response.status, `Retrieved ${data.length} items`);
            
            // Clear current list
            itemsList.innerHTML = '';
            
            // Add items to the list
            if (data.length === 0) {
                itemsList.innerHTML = '<li>No items found</li>';
            } else {
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'item-card';
                    li.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>${item.description || 'No description'}</p>
                        <p><strong>ID:</strong> ${item.id}</p>
                        <button class="delete-item" data-id="${item.id}">Delete</button>
                    `;
                    itemsList.appendChild(li);
                });
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-item').forEach(button => {
                    button.addEventListener('click', () => {
                        deleteIdInput.value = button.getAttribute('data-id');
                        deleteItem();
                    });
                });
            }
        } else {
            throw new Error(data.message || 'Failed to retrieve items');
        }
    } catch (error) {
        showResult(getResult, `Error: ${error.message}`, false);
        logRequest('GET', `${API_URL}/items`, 500, error.message);
    }
}

async function deleteItem() {
    const id = deleteIdInput.value.trim();
    
    if (!id) {
        showResult(deleteResult, 'Item ID is required!', false);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showResult(deleteResult, `Item with ID ${id} deleted successfully!`);
            logRequest('DELETE', `${API_URL}/items/${id}`, response.status, 'Item deleted successfully');
            
            // Clear the input
            deleteIdInput.value = '';
            
            // Refresh the items list
            getItems();
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete item');
        }
    } catch (error) {
        showResult(deleteResult, `Error: ${error.message}`, false);
        logRequest('DELETE', `${API_URL}/items/${id}`, 500, error.message);
    }
}

// Event Listeners
createBtn.addEventListener('click', createItem);
getBtn.addEventListener('click', getItems);
deleteBtn.addEventListener('click', deleteItem);

// Initialize
window.addEventListener('load', () => {
    checkApiStatus();
    getItems();
    
    // Check API status every 30 seconds
    setInterval(checkApiStatus, 30000);
});