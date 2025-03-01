var screenshot = null;
var name = null;
var email = null;
var reward = null;


document.addEventListener("DOMContentLoaded", function () {
    let startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", startChat);
    }

    if (sessionStorage.getItem("chatState")) {
        restoreChat();
    }
});

let chatStarted = false;
let chatHistory = [];

function saveChatState() {
    sessionStorage.setItem("chatState", JSON.stringify(chatHistory));
}

function restoreChat() {
    let savedChat = sessionStorage.getItem("chatState");
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        chatHistory.forEach(entry => {
            
            addMessage(entry.text, "bot");
            if (entry.options.length > 0) {
                addButton(entry.options, entry.callback);
            }
        });
    }
}

function startChat() {
    if (chatStarted) return;
    chatStarted = true;

    document.getElementById("start-button").style.display = "none";
    document.getElementById("chat-header").style.display = "block";
    document.getElementById("chat-box").style.display = "block";

    askQuestion("Where would you like to leave your review? (Please take a screenshot after submitting!)", [
        { text: "Google", value: "google" },
        { text: "Facebook", value: "facebook" }
    ], handleReviewPlatform);
}

function askQuestion(text, options = [], callback = null, type = "text") {
    addMessage(text, "bot");
    chatHistory.push({ text, options, callback });
    saveChatState();

    if (options.length > 0) {
        addButton(options, callback);
    } else {
        enableUserInput(callback, type);
    }

    showGoBackButton();
}

function enableUserInput(nextStep, type="text") {
    let userInput = document.getElementById("user-input");
    let sendButton = document.getElementById("send-button");

    userInput.style.display = "block";
    sendButton.style.display = "block";
    userInput.focus();

    sendButton.onclick = function () {
        let inputText = userInput.value.trim();
        if (inputText) {
            if (type === "name") {
                name = inputText;
            } else if (type === "email") {
                email = inputText;
            }

            addMessage("You: " + inputText, "user");
            userInput.value = "";
            userInput.style.display = "none";
            sendButton.style.display = "none";
            if (nextStep) nextStep(inputText);
        }
    };
}

function addMessage(text, sender) {
    let chatBox = document.getElementById("chat-box");
    let msg = document.createElement("div");
    msg.classList.add("chat-message", sender === "user" ? "user-message" : "bot-message");
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}

function addButton(options, callback) {
    let chatBox = document.getElementById("chat-box");
    let buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    options.forEach(option => {
        let button = document.createElement("button");
        button.textContent = option.text;
        button.classList.add("chat-button");
        button.onclick = function () {
            addMessage("You: " + option.text, "user");
            buttonContainer.remove();
            if (callback) callback(option.value);
        };
        buttonContainer.appendChild(button);
    });

    chatBox.appendChild(buttonContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}

function showGoBackButton() {
    let chatBox = document.getElementById("chat-box");
    let existingBackButton = document.getElementById("go-back-button");
    if (existingBackButton) existingBackButton.remove();

    if (chatHistory.length > 1) {
        let backButton = document.createElement("button");
        backButton.textContent = "← Go Back";
        backButton.id = "go-back-button";
        backButton.classList.add("chat-button");

        backButton.onclick = function () {
            goBack();
        };

        // Wait 500ms so messages appear first, THEN show the button
        setTimeout(() => {
            chatBox.appendChild(backButton);
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 500); // Delay helps reduce distraction
    }
}


function goBack() {
    if (chatHistory.length > 1) {
        chatHistory.pop(); // Remove the current question
        let lastStep = chatHistory.pop(); // Get the previous question
        document.getElementById("chat-box").innerHTML = ""; // Clear chat box

        // Rebuild the chat history up to the lastStep
        chatHistory.forEach(entry => {
            addMessage(entry.text, "bot");
            if (entry.options.length > 0) {
                addButton(entry.options, entry.callback);
            }
        });

        // **Now properly re-ask the lastStep question with its options or input box**
        if (lastStep.options.length > 0) {
            askQuestion(lastStep.text, lastStep.options, lastStep.callback);
        } else {
            askQuestion(lastStep.text, [], lastStep.callback);
        }
    }
    saveChatState();
}

function handleReviewPlatform(platform) {
    sessionStorage.setItem("reviewPlatform", platform);
    saveChatState();

    if (platform === "google") {
        window.open("https://www.google.com/search?q=green+chilli+bangor+reviews", "_blank");
    } else if (platform === "facebook") {
        window.open("https://www.facebook.com/greenchillibangor/reviews/", "_blank");
    }

    setTimeout(() => askForScreenshot(), 3000);
}

function askForScreenshot() {
    askQuestion(": Once you've left your review, upload a screenshot here.");
    addFileUploadOption();
}

function addFileUploadOption() {
    let chatBox = document.getElementById("chat-box");
    let uploadContainer = document.createElement("div");
    uploadContainer.classList.add("upload-container");

    let fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.classList.add("file-input");

    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            const file = fileInput.files[0];
            screenshot = file;
            
            addMessage("You uploaded: " + fileInput.files[0].name, "user");
            uploadContainer.remove();
            setTimeout(() => {
                askForName();
            }, 1000);
        }
    });

    uploadContainer.appendChild(fileInput);
    chatBox.appendChild(uploadContainer);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 🔥 Hide input field & send button during file upload
    document.getElementById("user-input").style.display = "none";
    document.getElementById("send-button").style.display = "none";

    saveChatState();
}


function askForName() {
    askQuestion("Thank you! Please provide your Full Name.", [], askForEmail, "name");
    
}

function askForEmail(name) {
    sessionStorage.setItem("userName", name);
    askQuestion("Now, please provide your Email Address.", [], finalThankYou, 'email');
}

function finalThankYou(email) {
    sessionStorage.setItem("userEmail", email);
    addMessage("Thank you for submitting your details!", "bot");

    // Add a button to trigger the spinner
    let chatBox = document.getElementById("chat-box");
    let spinButton = document.createElement("button");
    spinButton.textContent = "🎰 Spin the Wheel!";
    spinButton.classList.add("chat-button");
    spinButton.onclick = function () {
        spinButton.remove(); // Remove the button after clicking
        showSpinningAnimation();
    };

    chatBox.appendChild(spinButton);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}

// Function to create spinning animation
function showSpinningAnimation() {
    let chatBox = document.getElementById("chat-box");

    // Create a spinning message
    let spinner = document.createElement("div");
    spinner.classList.add("spinner");
    spinner.textContent = "🎰 Spinning...";

    chatBox.appendChild(spinner);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simulate spinning delay before displaying reward
    setTimeout(() => {
        spinner.remove(); // Remove the spinning animation
        giveReward(); // Display the reward
    }, 3000);
}

// Function to randomly select a reward
function giveReward() {
    let rewards = ["Chips 🍟", "Naan Bread", "Onion Bhaji", "Chicken Pakora"];
    let chosenReward = rewards[Math.floor(Math.random() * rewards.length)];
    reward = chosenReward;

    const file = screenshot;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async function () {
        const base64String = reader.result.split(',')[1];  // Remove "data:image/png;base64,"

        const formData = new URLSearchParams();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("reward", reward);
        formData.append("image", base64String);
        formData.append("filename", file.name);
        formData.append("mimeType", file.type);

            const response = await fetch("https://script.google.com/macros/s/AKfycbxWvAloMfpY3wYwdgcceOLSEsrSRfgHpKa0VGffuxeFKJumOsITzDTN8wrxEdpELcsb/exec", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById("status").innerHTML = `Image uploaded: <a href="${result.fileUrl}" target="_blank">View Image</a>`;
        } else {
            alert("Upload failed. Check console.");
            console.error(result.error);
        }
    }
    // Display the reward to the user
    addMessage(`🎉 You have won **${chosenReward}**!`, "bot");
    addMessage("Your review will be validated, and your voucher will be emailed to you within 12 hours.", "bot");
    addMessage("We appreciate your support and hope to serve you again soon!", "bot");

    saveChatState();
}
