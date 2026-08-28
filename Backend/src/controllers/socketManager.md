# How many of these are built in like .on("connection"), and how many are custom names, that were given according to convinience or custom use case and tell exactly for each of them, when is each triggered?

In this file, there are **7 event names**:

## Built-in Socket.IO events: 2

### 1. `"connection"`

```js
io.on("connection", (socket) => {})
```

Triggered automatically when a new client successfully connects to the Socket.IO server.

### 2. `"disconnect"`

```js
socket.on("disconnect", () => {})
```

Triggered automatically when a client disconnects, refreshes, closes the tab, or loses connection.

## Custom application events: 5

These names were chosen by your application:

### 3. `"join-call"`

```js
socket.on("join-call", ...)
```

Triggered by the frontend when a user enters a meeting. It creates/joins the meeting room.

### 4. `"signal"`

```js
socket.on("signal", ...)
```

Triggered by the frontend during WebRTC negotiation to send offers, answers, and ICE candidates.

### 5. `"chat-message"`

```js
socket.on("chat-message", ...)
```

Triggered by the frontend when a user sends a chat message.

### 6. `"user-joined"`

```js
io.to(...).emit("user-joined", ...)
```

Triggered by the backend after a user joins a room. Frontends listen for it to prepare peer connections.

### 7. `"user-left"`

```js
socket.to(path).emit("user-left", ...)
```

Triggered by the backend when a connected user disconnects. Other users remove that person’s video connection.

So the count is:

```text
Built-in: 2
Custom:    5
Total:     7
```

`"connection"` and `"disconnect"` are recognized automatically by Socket.IO. The other five only work because both frontend and backend agree to use those exact names.