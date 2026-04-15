import { Server } from "socket.io";
// Imports the Socket.IO Server class
// This is used to create a real-time server that attaches to an HTTP server

let connections = {}; 
// Keeps track of who is connected to which meeting (room)
// Structure example:
// {
//   meetingCode1: [socketId1, socketId2],
//   meetingCode2: [socketId3]
// }

let messages = {};
// Placeholder for chat messages per meeting
// Not fully implemented yet, but kept for future chat history

let timeOnline = {};
// Stores when a socket joined (used later for analytics, duration, etc.)

export function connectToSocket(httpServer) {
    // This function receives the already-created HTTP server
    // Socket.IO must attach to the real HTTP server (not Express)

    // Must use real origins with credentials — "*" + credentials is rejected by browsers.
    // const socketAllowedOrigins = [
    //     "http://localhost:5173",
    //     "http://127.0.0.1:5173",
    // ];

    const io = new Server(httpServer, {
        cors: {
            origin: "*", // for all requests (don't use for production)
            methods: ['PUT','GET'],
            allowedHeaders: "*",
            credentials: true
        }
    });
    // Creates a Socket.IO server and binds it to the HTTP server
    // This allows WebSocket upgrades on the same port

        //     **Short and clear version why you need cors here:**

        // * A Socket.IO connection **starts as a normal HTTP request**
        // * Browsers apply **CORS rules to that request**
        // * Socket.IO’s HTTP requests **do not go through Express**
        // * So Express CORS settings **don’t affect sockets**

        // That’s why:

        // * you configure CORS in Express → for API routes
        // * you configure CORS again in Socket.IO → for socket connections

        // **Easy analogy:**
        // Express and Socket.IO have **separate doors**.
        // You must allow entry at **both doors**, or the browser blocks one of them.


    io.on("connection", (socket) => {
        // This runs EVERY time a new client connects via Socket.IO
        // `socket` represents ONE connected client (one browser tab)

        console.log("New socket connected:", socket.id);
        // socket.id is a unique identifier for this client

        socket.on("join-call", (path) => {
            // Fired when a client wants to join a meeting
            // `path` is the meetingCode / room name (full link) https://example.com/page?name=mohit => https://example.com/page?name=mohit


            if (connections[path] === undefined) {
                connections[path] = [];
                // connections is an object, in which we made a key ${path} which is itself an array and it stores multiple values
            }
            // If this is the first user in the meeting, initialize array

            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }
            // Add this user's socket ID once (reconnect / duplicate join-call must not duplicate)

            timeOnline[socket.id] = new Date();
            // Store join time (used later for analytics / duration)

            socket.join(path);
            // Adds this socket to a Socket.IO room
            // Room name = meetingCode

            // Notify everyone else in the room that a new user joined
            for (let i = 0; i < connections[path].length; i++) {
                io.to(connections[path][i]).emit(
                    "user-joined",
                    socket.id,
                    connections[path]
                );
            }
        });


        socket.on("signal", (data) => {
            /*
                data contains:
                {
                    to: socketId,
                    sdp: ...,
                    candidate: ...
                }
            */
            // Used for WebRTC signaling
            // `to` = socket ID of the peer
            // `message` = offer / answer / ICE candidate

            io.to(data.to).emit("signal", {
                from: socket.id,          // who sent it
                sdp: data.sdp,            // offer / answer
                candidate: data.candidate // ICE candidate
            });
            // Forward signaling data to the intended peer
            // Socket.IO is ONLY a messenger here


                // Perfect explanation with analogy

            // .on works like an event listener: it waits for a client to emit an event (like join or send message).
// When a user triggers that event, the callback runs, and inside it the server uses .to().emit() to broadcast the result to other users in the meeting.
        });

        
        socket.on("chat-message", (data, sender) => {
            // --- 1. SERVER-SIDE ROOM VERIFICATION (SECURITY) ---
            // We don't trust the room name sent by the client (payload.path). 
            // Instead, we search our 'connections' object to find which room this socket.id actually belongs to.
            const matchingRoom = Object.keys(connections).find((path) =>
                connections[path]?.includes(socket.id)
            );

            // If the socket is not found in any room, we stop.
            // This prevents "Ghost" messages or unauthorized users from sending chats.
            if (!matchingRoom) {
                return;
            }

            // --- 2. DATA NORMALIZATION (THE "CLEANER") ---
            // Just like the frontend, we extract the actual text whether 'data' is a string or an object.
            const messageText =
                typeof data === "string"
                    ? data.trim()
                    : typeof data?.message === "string"
                        ? data.message.trim()
                        : typeof data?.data === "string"
                            ? data.data.trim()
                            : "";

            // If the message is empty after trimming, ignore it.
            if (!messageText) {
                return;
            }

            // --- 3. STORAGE INITIALIZATION ---
            // If this is the very first message in this specific room, create an empty array for it.
            if (messages[matchingRoom] === undefined) {
                messages[matchingRoom] = [];
            }

            // --- 4. DATA PERSISTENCE (IN-MEMORY) ---
            // We push the message details into the 'messages' object.
            // Even if we don't send this history back yet, it's useful for logs or future features.
            messages[matchingRoom].push({
                sender,                // The username (Mohit, etc.)
                data: messageText,     // The cleaned message text
                senderSocketId: socket.id, // The unique ID of the person who sent it
                time: new Date()       // Current timestamp
            });

            // --- 5. THE BROADCAST ---
            // 'socket.to(matchingRoom)' sends the message to everyone in that room EXCEPT the sender.
            // We send 3 distinct arguments: the text, the name, and the sender's ID.
            // This perfectly matches your frontend's 'addMessage' function parameters.
            socket.to(matchingRoom).emit("chat-message", messageText, sender, socket.id);

            // Note: 'io.to(room)' would send it to everyone INCLUDING the sender. 
            // We use 'socket.to(room)' to avoid the sender getting a duplicate of their own message.
        });

            //  Compare the two (VERY IMPORTANT)
                // ❌ Sends to EVERYONE (including sender)
                // io.to(room).emit(...)

                // ✅ Sends to everyone EXCEPT sender
                // socket.to(room).emit(...)


//         socket.on("chat-message", (data, sender) => {
//     /*
//         DIFFERENCE FROM EARLIER VERSION:
//         --------------------------------
//         Earlier, we trusted `data.path` (room / meetingCode) sent by the client.
//         That assumes:
//         - client always sends correct room
//         - client is not buggy or malicious

//         This version DOES NOT trust the client.
//         Instead, the server figures out which room this socket belongs to.
//     */

//     /*
//         Object.entries(connections)
//         ---------------------------
//         `connections` is an object like:
//         {
//             roomA: [socketId1, socketId2],
//             roomB: [socketId3]
//         }

//         Object.entries converts it to:
//         [
//             ["roomA", [socketId1, socketId2]],
//             ["roomB", [socketId3]]
//         ]

//         We use this to SEARCH all rooms.
//     */

//     const [matchingRoom, found] = Object.entries(connections).reduce( // Object.entries returns the key, value pairs => 
// [
//   ["roomA", ["id1", "id2"]],
//   ["roomB", ["id3"]]
// ]

//         ([room, isFound], [roomKey, roomValue]) => {
    // In reduce, the second parameter is always the current element from the array being iterated, while the first (accumulator) is fully controlled by you. - can be anything but keep returning it in the same structure each time.
//             /*
//                 `room`     → currently matched room (string)
//                 `isFound`  → whether we already found the room
//                 `roomKey`  → current room name in loop
//                 `roomValue`→ array of socket IDs in that room
//             */

//             /*
//                 DIFFERENCE:
//                 ----------
//                 Earlier code:
//                 - assumed we already know the room
//                 - no searching required

//                 Now:
//                 - we check EVERY room
//                 - and see if socket.id exists inside it
//             */

//             if (!isFound && roomValue.includes(socket.id)) {
//                 /*
//                     If:
//                     - we have NOT found the room yet
//                     - AND this room contains the current socket.id

//                     Then this is the correct meeting for this socket.
//                 */
//                 return [roomKey, true];
//             }

//             /*
//                 If not found yet, or socket not in this room,
//                 keep previous state unchanged.
//             */
//             return [room, isFound];
//         },
//         ["", false] // initial values: no room, not found
//     );

//     /*
//         At this point:
//         -------------
//         - matchingRoom → room name where socket belongs
//         - found        → boolean (true if room was found)

//         If found === false:
//         - socket is not part of any meeting
//         - message should NOT be processed
//     */

//     if (found === true) {
//         /*
//             DIFFERENCE:
//             ----------
//             Earlier version:
//             - assumed messages[data.path] exists or can be created

//             Now:
//             - we use matchingRoom (server-trusted)
//         */

//         if (messages[matchingRoom] === undefined) {
//             /*
//                 Initialize chat storage for this room
//                 Only done when first message arrives
//             */
//             messages[matchingRoom] = [];
//         }

//         /*
//             Store message in server memory
//             ------------------------------
//             This allows:
//             - chat history
//             - debugging
//             - replay for late joiners (future)
//         */
//         messages[matchingRoom].push({
//             sender,            // who sent the message
//             data,              // message content
//             senderSocketId: socket.id,
//             time: new Date()   // timestamp
//         });

//         /*
//             DIFFERENCE:
//             ----------
//             Earlier version:
//             socket.to(data.path).emit(...)

//             Now:
//             socket.to(matchingRoom).emit(...)

//             Why?
//             ----
//             - matchingRoom is verified by server
//             - data.path could be wrong / tampered
//         */

//         socket.to(matchingRoom).emit("chat-message", data, sender);
//         /*
//             Sends message to:
//             - everyone in the room
//             - EXCEPT the sender

//             Sender already knows what they sent.
//         */
//     }

//     /*
//         If found === false:
//         ------------------
//         - socket is not part of any room
//         - we silently ignore the message

//         This prevents:
//         - crashes
//         - undefined room errors
//         - unauthorized message sending
//     */
// });



        socket.on("disconnect", () => {
            // Fired when:
            // - user closes tab
            // - network drops
            // - user leaves meeting

            // ---

            // ### 1️⃣ Does the name have to be `"disconnect"`?

            // **Yes.**
            // `"disconnect"` is a **reserved event name** in Socket.IO.

            // You **cannot rename it** to:

            // * `"leave"`
            // * `"exit"`
            // * `"close"`

            // Those won’t work automatically.

            // ---

            // ### 2️⃣ Is it case-sensitive?

            // **Yes.**

            // * `"disconnect"` ✅
            // * `"Disconnect"` ❌
            // * `"DISCONNECT"` ❌

            // Event names in Socket.IO are **case-sensitive**.

            // ---

            // ### 3️⃣ Who triggers this function?

            // **Socket.IO itself.**

            // It fires automatically when:

            // * the browser tab closes
            // * the user refreshes
            // * the network drops
            // * the socket connection ends

            // You **never emit it yourself**.

            // ---

            // ### 4️⃣ Why does it work without you calling it?

            // Because:

            // * Socket.IO monitors the connection
            // * When the connection breaks, it internally emits `"disconnect"`
            // * Your handler runs automatically

            // ---

            // ### One-line takeaway (remember this)

            // > `"disconnect"` is a built-in, case-sensitive Socket.IO event that the library fires automatically when a connection ends.


            console.log("Socket disconnected:", socket.id);

            for (const path in connections) { // path is/are the -> keys of connections
                // What this loop does
                // This loops through all meetings in memory.

                // Because:
                //     we only have socket.id
                //     we don’t know which meeting this socket belonged to
                const index = connections[path].indexOf(socket.id);

                if (index !== -1) {
                    connections[path].splice(index, 1);
                    // Remove socket from meeting participant list

                    socket.to(path).emit("user-left", socket.id);
                    // Notify others in the meeting

//                     **Yes — it notifies everyone automatically. No loop is needed.**

                    // Here’s why, short and clear.
                    // ---
                    // ### Why no loop is required
                    // ```js
                    // socket.to(path).emit("user-left", socket.id);
                    // ```

                    // * `path` is a **room**
                    // * Socket.IO already knows:

                    //   * all sockets in that room
                    //   * which socket sent the event

                    // So Socket.IO internally does:
                    // > “Send this event to **all sockets in the room except the sender**.”
                    // You don’t loop because **Socket.IO handles the fan-out for you**.

                    // ---

                    // ### Why your earlier code used a loop
                    // Earlier you had:

                    // ```js
                    // for (...) {
                    //   io.to(socketId).emit(...)
                    // }
                    // ```

                    // That was:

                    // * manual broadcasting
                    // * less idiomatic
                    // * useful only when you target **specific socket IDs**

                    // Rooms remove that need.

                    // ---

                    if (connections[path].length === 0) {
                        delete connections[path];
                        delete messages[path];
                        // Cleanup empty meetings from memory
                    }

                    break;
                }
            }

            delete timeOnline[socket.id];
            // Cleanup join-time tracking
        });
    });

    return io;
    // Returns io instance so it can be reused elsewhere if needed
}
