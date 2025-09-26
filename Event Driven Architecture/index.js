// app.js
const EventEmitter = require("events");

// Create event bus
const eventBus = new EventEmitter();

// -----------------------------
// Register event listeners
// -----------------------------

// userLoggedIn event
eventBus.on("userLoggedIn", (username) => {
  console.log(`> User ${username} logged in`);
});

eventBus.on("userLoggedIn", (username) => {
  console.log(`> Notification sent to ${username}`);
});

// messageReceived event
eventBus.on("messageReceived", (username, message) => {
  console.log(`> New message for ${username}: "${message}"`);
});

eventBus.on("messageReceived", (username) => {
  console.log(`> Alert sound for ${username}`);
});

// dataSynced event
eventBus.on("dataSynced", (username) => {
  console.log(`> Data sync complete for ${username}`);
});

// -----------------------------
// Simulate app flow
// -----------------------------
function simulateApp(username) {
  // 1. User logs in
  setTimeout(() => {
    eventBus.emit("userLoggedIn", username);

    // 2. Message received after login
    setTimeout(() => {
      eventBus.emit("messageReceived", username, "Welcome back!");
    }, 1000);

    // 3. Start syncing data
    setTimeout(() => {
      console.log("> Syncing user data...");
      setTimeout(() => {
        eventBus.emit("dataSynced", username);
      }, 1000);
    }, 2000);
  }, 500);
}

// Run simulation
simulateApp("John");
