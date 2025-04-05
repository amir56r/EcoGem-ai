// API Configuration - Using the correct Gemini model
const apiKey = 'AIzaSyAozvfwtVSCzX_yeJEIr8mr99SZjSyu3xM'; // Replace with your actual API key
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
const searchApiUrl = 'https://www.googleapis.com/customsearch/v1';
const searchApiKey = 'YOUR_SEARCH_API_KEY'; // Replace with your Google Search API key
const searchEngineId = 'YOUR_SEARCH_ENGINE_ID'; // Replace with your Custom Search Engine ID

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appContainer = document.getElementById('appContainer');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const privacyLink = document.getElementById('privacyLink');
const userName = document.getElementById('userName');
const viewHistory = document.getElementById('viewHistory');
const privacyBtn = document.getElementById('privacyBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryList = document.getElementById('chatHistoryList');
const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const webSearchBtn = document.getElementById('webSearchBtn');
const exploreBtn = document.getElementById('exploreBtn');
const exploreGrid = document.getElementById('exploreGrid');
const historyModal = document.getElementById('historyModal');
const privacyModal = document.getElementById('privacyModal');
const actionHistoryList = document.getElementById('actionHistoryList');
const closeModals = document.querySelectorAll('.close-modal');
const quickActions = document.querySelectorAll('.quick-action');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

// App State
let currentUser = null;
let chatHistory = [];
let actionHistory = [];
let currentChatId = null;
let isWebSearchEnabled = false;
let isSidebarOpen = false;

// Initialize the app
function init() {
    checkAuthState();
    setupEventListeners();
}

// Check if user is authenticated
function checkAuthState() {
    const user = localStorage.getItem('ecoGemUser');
    if (user) {
        currentUser = JSON.parse(user);
        userName.textContent = currentUser.name.split(' ')[0];
        loadUserData();
        authScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Auth screen
    loginTab.addEventListener('click', () => switchAuthTab('login'));
    signupTab.addEventListener('click', () => switchAuthTab('signup'));
    loginButton.addEventListener('click', handleLogin);
    signupButton.addEventListener('click', handleSignup);
    privacyLink.addEventListener('click', showPrivacyModal);
    
    // Main app
    viewHistory.addEventListener('click', showActionHistory);
    privacyBtn.addEventListener('click', showPrivacyModal);
    newChatBtn.addEventListener('click', startNewChat);
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    userInput.addEventListener('input', autoResizeTextarea);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    webSearchBtn.addEventListener('click', toggleWebSearch);
    exploreBtn.addEventListener('click', toggleExplore);
    closeModals.forEach(btn => btn.addEventListener('click', closeAllModals));
    quickActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.getAttribute('data-prompt');
            userInput.value = prompt;
            autoResizeTextarea();
            userInput.focus();
        });
    });
    
    // Explore cards
    document.querySelectorAll('.explore-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const prompt = e.currentTarget.getAttribute('data-prompt');
            userInput.value = prompt;
            autoResizeTextarea();
            userInput.focus();
        });
    });
    
    // Mobile menu
    mobileMenuBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    // Click outside dropdown to close it
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}

// Toggle mobile sidebar
function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    sidebar.classList.toggle('active', isSidebarOpen);
    overlay.classList.toggle('active', isSidebarOpen);
}

// Switch between login and signup tabs
function switchAuthTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

// Handle user login
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) {
        loginError.textContent = 'Please fill in all fields';
        return;
    }
    
    // In a real app, you would verify credentials with a backend
    const users = JSON.parse(localStorage.getItem('ecoGemUsers')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('ecoGemUser', JSON.stringify(user));
        userName.textContent = user.name.split(' ')[0];
        loadUserData();
        authScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
    } else {
        loginError.textContent = 'Invalid email or password';
    }
}

// Handle user signup
function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirm').value.trim();
    
    if (!name || !email || !password || !confirmPassword) {
        signupError.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('ecoGemUsers')) || [];
    if (users.some(u => u.email === email)) {
        signupError.textContent = 'Email already registered';
        return;
    }
    
    // Create new user
    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);
    localStorage.setItem('ecoGemUsers', JSON.stringify(users));
    localStorage.setItem('ecoGemUser', JSON.stringify(newUser));
    
    currentUser = newUser;
    userName.textContent = name.split(' ')[0];
    startNewChat();
    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
}

// Load user data from localStorage
function loadUserData() {
    if (!currentUser) return;
    
    const userData = JSON.parse(localStorage.getItem(`ecoGemData_${currentUser.id}`)) || {};
    chatHistory = userData.chatHistory || [];
    actionHistory = userData.actionHistory || [];
    
    renderChatHistory();
}

// Save user data to localStorage
function saveUserData() {
    if (!currentUser) return;
    
    const userData = {
        chatHistory,
        actionHistory
    };
    
    localStorage.setItem(`ecoGemData_${currentUser.id}`, JSON.stringify(userData));
}

// Start a new chat
function startNewChat() {
    currentChatId = Date.now().toString();
    chatWindow.innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to EcoGem AI</h2>
            <p>Your sustainable AI assistant powered by Google Gemini</p>
            <div class="quick-actions">
                <button class="quick-action" data-prompt="Help me plan a sustainable diet">
                    <i class="fas fa-utensils"></i> Sustainable Diet
                </button>
                <button class="quick-action" data-prompt="Suggest eco-friendly products for my home">
                    <i class="fas fa-home"></i> Eco Products
                </button>
                <button class="quick-action" data-prompt="Explain carbon footprint in simple terms">
                    <i class="fas fa-shoe-prints"></i> Carbon Footprint
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners to quick actions
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = e.currentTarget.getAttribute('data-prompt');
            userInput.value = prompt;
            autoResizeTextarea();
            userInput.focus();
        });
    });
    
    // Close sidebar on mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

// Render chat history list
function renderChatHistory() {
    chatHistoryList.innerHTML = '';
    
    const groupedChats = chatHistory.reduce((acc, chat) => {
        if (!acc[chat.chatId]) {
            acc[chat.chatId] = {
                chatId: chat.chatId,
                title: chat.chatId === currentChatId ? 'Current Chat' : chat.title || `Chat ${chat.chatId.slice(-4)}`,
                timestamp: chat.timestamp
            };
        }
        return acc;
    }, {});
    
    const sortedChats = Object.values(groupedChats).sort((a, b) => b.timestamp - a.timestamp);
    
    sortedChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.chatId === currentChatId ? 'active' : ''}`;
        chatItem.textContent = chat.title;
        chatItem.addEventListener('click', () => loadChat(chat.chatId));
        chatHistoryList.appendChild(chatItem);
    });
}

// Load a specific chat
function loadChat(chatId) {
    currentChatId = chatId;
    chatWindow.innerHTML = '';
    
    const messages = chatHistory.filter(msg => msg.chatId === chatId);
    messages.forEach(msg => {
        addMessageToChat(msg.role, msg.content, false);
    });
    
    if (messages.length === 0) {
        chatWindow.innerHTML = `
            <div class="welcome-message">
                <h2>No messages in this chat</h2>
                <p>Start a new conversation with EcoGem AI</p>
            </div>
        `;
    }
    
    renderChatHistory();
    scrollToBottom();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

// Auto-resize textarea as user types
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
}

// Send user message and get AI response
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Create new chat if none exists
    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }
    
    // Add user message to chat
    addMessageToChat('user', message);
    chatHistory.push({
        chatId: currentChatId,
        role: 'user',
        content: message,
        timestamp: Date.now(),
        title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
    });
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show typing indicator
    typingIndicator.style.display = 'flex';
    scrollToBottom();
    
    try {
        let aiResponse;
        
        if (isWebSearchEnabled) {
            // Perform web search and get AI response
            aiResponse = await performWebSearch(message);
            isWebSearchEnabled = false;
            webSearchBtn.classList.remove('active');
        } else {
            // Get regular AI response
            aiResponse = await getGeminiResponse(message);
        }
        
        // Add AI response to chat
        addMessageToChat('ai', aiResponse);
        chatHistory.push({
            chatId: currentChatId,
            role: 'ai',
            content: aiResponse,
            timestamp: Date.now()
        });
        
        // Add to action history
        actionHistory.unshift({
            type: 'chat',
            prompt: message,
            response: aiResponse,
            timestamp: Date.now()
        });
        
        // Save data
        saveUserData();
        renderChatHistory();
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.message.includes('API key') 
            ? "API key error. Please check your Gemini API key."
            : error.message.includes('response format') 
                ? "Received unexpected response from API."
                : "Sorry, I'm having trouble connecting. Please try again later.";
        
        addMessageToChat('ai', errorMessage);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        typingIndicator.style.display = 'none';
        userInput.focus();
    }
}

// Add a message to the chat UI
function addMessageToChat(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);
    
    if (role === 'ai') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyButton = document.createElement('button');
        copyButton.title = 'Copy to clipboard';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(content).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
        
        actionsDiv.appendChild(copyButton);
        messageDiv.appendChild(actionsDiv);
    }
    
    if (animate) {
        messageDiv.style.opacity = '0';
        chatWindow.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 10);
    } else {
        chatWindow.appendChild(messageDiv);
    }
    
    if (animate) scrollToBottom();
    return messageDiv;
}

// Scroll chat to the bottom
function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Get response from Gemini API
async function getGeminiResponse(prompt) {
    // Get messages from current chat
    const currentChatMessages = chatHistory.filter(msg => msg.chatId === currentChatId);
    
    // Prepare the request payload
    const contents = currentChatMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));
    
    // Add the new user message
    contents.push({
        role: 'user',
        parts: [{ text: prompt }]
    });
    
    const requestBody = {
        contents,
        safetySettings: [
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH"
            }
        ],
        generationConfig: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048
        }
    };
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates in response');
    }
    
    const firstCandidate = data.candidates[0];
    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
        throw new Error('Unexpected response format');
    }
    
    return firstCandidate.content.parts[0].text || "I couldn't generate a response. Please try again.";
}

// Perform web search and get AI response
async function performWebSearch(query) {
    try {
        // First perform the web search
        const searchResponse = await fetch(`${searchApiUrl}?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`);
        
        if (!searchResponse.ok) {
            throw new Error('Failed to perform web search');
        }
        
        const searchData = await searchResponse.json();
        
        // Format search results for the AI
        let searchContext = "Here are some web search results for your query:\n\n";
        
        if (searchData.items && searchData.items.length > 0) {
            searchData.items.slice(0, 3).forEach((item, index) => {
                searchContext += `${index + 1}. ${item.title}\n${item.snippet}\nURL: ${item.link}\n\n`;
            });
        } else {
            searchContext += "No relevant web results found.\n";
        }
        
        // Add to action history
        actionHistory.unshift({
            type: 'search',
            query,
            results: searchData.items ? searchData.items.slice(0, 3) : [],
            timestamp: Date.now()
        });
        
        // Now get AI response with search context
        const aiResponse = await getGeminiResponse(`Web search results for: ${query}\n\n${searchContext}\n\nPlease provide a comprehensive answer based on these results and your knowledge.`);
        
        return `${aiResponse}\n\n[Web search results included in this response]`;
    } catch (error) {
        console.error('Search error:', error);
        // Fall back to regular response if search fails
        return await getGeminiResponse(`I couldn't perform a web search for "${query}". Here's what I know:\n\n${query}`);
    }
}

// Toggle web search mode
function toggleWebSearch() {
    isWebSearchEnabled = !isWebSearchEnabled;
    webSearchBtn.classList.toggle('active', isWebSearchEnabled);
    addMessageToChat('ai', `Web search is now ${isWebSearchEnabled ? 'enabled' : 'disabled'} for your next message.`);
}

// Toggle explore grid visibility
function toggleExplore() {
    exploreGrid.classList.toggle('hidden');
    if (!exploreGrid.classList.contains('hidden')) {
        scrollToBottom();
    }
}

// Handle file upload
function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        addMessageToChat('ai', 'File is too large. Please upload files smaller than 5MB.');
        return;
    }
    
    // Check file type
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'image/jpeg', 'image/png'];
    
    if (!validTypes.includes(file.type)) {
        addMessageToChat('ai', 'Unsupported file type. Please upload PDF, DOC, TXT, JPG, or PNG files.');
        return;
    }
    
    // Process the file (in a real app, you would upload to a server)
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        let content;
        
        if (file.type.startsWith('image/')) {
            // For images, we can describe them (in a real app, use vision API)
            content = `[Uploaded image: ${file.name}] I can see you've uploaded an image. While I can't view images directly in this version, you can describe it to me and I'll do my best to help.`;
        } else {
            // For text-based files, extract text (simplified)
            if (file.type === 'application/pdf') {
                content = `[Uploaded PDF: ${file.name}] PDF content extraction would require a server-side process.`;
            } else if (file.type.includes('word')) {
                content = `[Uploaded Word document: ${file.name}] DOC content extraction would require a server-side process.`;
            } else {
                // Plain text file
                content = `[Uploaded text file: ${file.name}]\n\n${e.target.result}`;
            }
        }
        
        // Add file info to chat
        addMessageToChat('user', `[File: ${file.name}]`);
        chatHistory.push({
            chatId: currentChatId,
            role: 'user',
            content: `[File: ${file.name}]`,
            timestamp: Date.now()
        });
        
        // Add AI response
        addMessageToChat('ai', content);
        chatHistory.push({
            chatId: currentChatId,
            role: 'ai',
            content: content,
            timestamp: Date.now()
        });
        
        // Add to action history
        actionHistory.unshift({
            type: 'file_upload',
            filename: file.name,
            filetype: file.type,
            timestamp: Date.now()
        });
        
        saveUserData();
    };
    
    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
    
    // Reset file input
    fileInput.value = '';
}

// Show action history modal
function showActionHistory(e) {
    e.preventDefault();
    actionHistoryList.innerHTML = '';
    
    actionHistory.forEach((action, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        let content = '';
        let icon = '';
        
        switch (action.type) {
            case 'chat':
                icon = '<i class="fas fa-comment"></i>';
                content = `
                    <h4>Chat Interaction</h4>
                    <p><strong>You:</strong> ${action.prompt.slice(0, 100)}${action.prompt.length > 100 ? '...' : ''}</p>
                `;
                break;
            case 'search':
                icon = '<i class="fas fa-search"></i>';
                content = `
                    <h4>Web Search</h4>
                    <p><strong>Query:</strong> ${action.query}</p>
                    <p><strong>Results:</strong> ${action.results.length} found</p>
                `;
                break;
            case 'file_upload':
                icon = '<i class="fas fa-file-upload"></i>';
                content = `
                    <h4>File Upload</h4>
                    <p><strong>File:</strong> ${action.filename}</p>
                    <p><strong>Type:</strong> ${action.filetype}</p>
                `;
                break;
        }
        
        item.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                ${icon}
                <div>${content}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // In a full implementation, you might show details or replay the action
            alert(`Viewing details for ${action.type} action from ${new Date(action.timestamp).toLocaleString()}`);
        });
        
        actionHistoryList.appendChild(item);
    });
    
    historyModal.style.display = 'block';
}

// Show privacy policy modal
function showPrivacyModal(e) {
    e.preventDefault();
    privacyModal.style.display = 'block';
}

// Close all modals
function closeAllModals() {
    historyModal.style.display = 'none';
    privacyModal.style.display = 'none';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);