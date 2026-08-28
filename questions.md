## Project Overview

### 1. Can you briefly explain your project?

**Answer:**  
It is a real-time video meeting application built with React, Node.js, Express, Socket.IO, WebRTC, MongoDB, Passport.js, and Express sessions. Users can sign up, log in, join meetings using a meeting code, communicate through video/audio, share their screen, and chat in real time.

### 2. What happens when a user joins a meeting?

**Answer:**  
The frontend navigates to a meeting URL such as `/<meetingCode>`. The `VideoMeet` component connects to the backend using Socket.IO and emits the `join-call` event with the current URL. The backend uses that URL as a Socket.IO room name and notifies other participants.

### 3. Why did you use WebRTC?

**Answer:**  
WebRTC enables real-time peer-to-peer audio and video communication directly between browsers. It reduces media-processing work on the server and provides low-latency communication.

### 4. Why did you use Socket.IO along with WebRTC?

**Answer:**  
WebRTC does not automatically discover or connect peers. Socket.IO acts as the signaling channel. It exchanges socket IDs, SDP offers, SDP answers, and ICE candidates between users.

### 5. What is signaling?

**Answer:**  
Signaling is the process of exchanging connection information before the WebRTC media connection is established. In this project, Socket.IO transports SDP offers, SDP answers, and ICE candidates.

### 6. What is an SDP offer?

**Answer:**  
An SDP offer describes the sender’s media capabilities, supported codecs, tracks, and connection information. One peer creates it and sends it to another peer through Socket.IO.

### 7. What is an SDP answer?

**Answer:**  
The receiving peer creates an SDP answer after receiving an offer. It describes what it accepts and provides its own media and network information.

### 8. What are ICE candidates?

**Answer:**  
ICE candidates represent possible network paths between two peers. WebRTC exchanges them to find the best route for audio and video traffic.

### 9. Why is ICE candidate queuing needed in your code?

**Answer:**  
An ICE candidate can arrive before the remote SDP has been applied. WebRTC may reject it in that state, so the application temporarily stores the candidate and adds it after `setRemoteDescription()` completes.

### 10. What is the purpose of `RTCPeerConnection`?

**Answer:**  
`RTCPeerConnection` represents the WebRTC connection between two browsers. It manages media tracks, SDP negotiation, ICE candidates, and remote streams.

### 11. How does a new participant discover existing participants?

**Answer:**  
When a client emits `join-call`, the backend adds its socket ID to the room’s connection list and emits `user-joined` with the participant list. Existing clients create peer connections for the new participant.

### 12. Why does the server emit `user-joined` to each participant?

**Answer:**  
Each client needs to know which peers exist so it can create the required `RTCPeerConnection` objects and begin WebRTC negotiation.

### 13. Why is `socket.to(room).emit()` used for chat messages?

**Answer:**  
It broadcasts the message to everyone else in the room except the sender. The sender immediately adds the message to its own UI, preventing duplicate messages.

### 14. Why do you store messages in the `messages` object if you broadcast them?

**Answer:**  
Broadcasting delivers messages in real time, while the `messages` object stores them temporarily on the server. However, this storage is currently only in memory and is not exposed to the frontend as chat history.

### 15. What happens when a user disconnects?

**Answer:**  
Socket.IO triggers the built-in `disconnect` event. The server removes the socket ID from its room, notifies remaining users with `user-left`, and deletes empty room data.

### 16. Which event names are built into Socket.IO?

**Answer:**  
`connection` and `disconnect` are built-in Socket.IO events. Events such as `join-call`, `signal`, `chat-message`, `user-joined`, and `user-left` are custom application events.

### 17. Why are `connections`, `messages`, and `timeOnline` global variables?

**Answer:**  
They are shared by the backend process so all connected sockets can access room, message, and timing information. Their entries are separated by room paths or socket IDs.

### 18. What is a limitation of storing this data in global objects?

**Answer:**  
The data is lost when the server restarts. It also is not shared between multiple backend instances, which creates problems when scaling horizontally.

### 19. How would you make Socket.IO work across multiple backend instances?

**Answer:**  
I would use a shared Socket.IO adapter, commonly the Redis adapter. Redis would allow different backend instances to share room and event information. A load balancer would also need sticky sessions or a compatible transport configuration.

### 20. How does your application authenticate users?

**Answer:**  
Passport Local Strategy checks the username and password against MongoDB. On successful login, Passport serializes the user into an Express session, and the browser receives a session cookie.

### 21. How are protected frontend pages handled?

**Answer:**  
The `withAuth` higher-order component calls `/user/session`. If the backend confirms that the user is authenticated, it renders the protected component. Otherwise, it navigates to `/login`.

### 22. Why is `credentials: "include"` necessary?

**Answer:**  
It tells the browser to send and accept cookies during cross-origin requests. Without it, the session cookie would not be included and the backend would treat every request as unauthenticated.

### 23. Why did deployment require different cookie settings?

**Answer:**  
The frontend and backend use different domains in production. Cross-site HTTPS cookies require settings such as:

```js
sameSite: "none",
secure: true
```

Express also needs to trust Render’s proxy so secure cookies work correctly.

### 24. What was the deployment API URL problem?

**Answer:**  
The deployed frontend was still configured to call `http://localhost:3000`. In production, `localhost` refers to the user’s own computer, not the deployed backend. The frontend now uses `VITE_API_URL` or the deployed backend URL.

### 25. Why did the backend originally try connecting to `127.0.0.1:27017`?

**Answer:**  
The local `.env` file was inside `src`, but dotenv was searching relative to the process directory. As a result, `ATLASDB_URL` was not loaded and the code used the local MongoDB fallback.

### 26. How does the application handle camera and microphone permissions?

**Answer:**  
The browser’s `getUserMedia()` API requests camera and microphone access. If access is denied or unavailable, the application uses synthetic black video and silent audio tracks to keep the WebRTC connection stable.

### 27. Why use synthetic media tracks?

**Answer:**  
WebRTC connections generally work more reliably when expected media tracks exist. A black video track and silent audio track allow the peer connection to remain active when a device is unavailable or disabled.

### 28. How does screen sharing work?

**Answer:**  
The application uses `navigator.mediaDevices.getDisplayMedia()`. The resulting screen track replaces the existing video track on each peer connection using `RTCRtpSender.replaceTrack()` or the local track update logic.

### 29. What happens if a user turns off their camera?

**Answer:**  
The application stops or replaces the camera track with a black video track, then renegotiates the peer connection so other users receive the updated media state.

### 30. What is the scaling limitation of your current WebRTC design?

**Answer:**  
It uses a peer-to-peer mesh. With `n` participants, each browser may need up to `n - 1` peer connections, creating approximately $O(n^2)$ connection relationships. This becomes expensive for larger meetings.

### 31. How would you support large meetings?

**Answer:**  
I would use an SFU, such as mediasoup, Janus, LiveKit, or Jitsi. Each participant uploads one stream to the SFU, and the SFU forwards selected streams to other participants. This is more scalable than a full mesh.

### 32. What is the difference between an SFU and an MCU?

**Answer:**  
An SFU forwards media streams without mixing them, which is more efficient and preserves quality. An MCU receives, mixes, and retransmits streams as one combined stream, but requires significantly more server CPU.

### 33. What happens if two users use the same meeting URL?

**Answer:**  
They join the same Socket.IO room because the full frontend URL is used as the room key. Their sockets are then included in the same participant list and WebRTC signaling occurs between them.

### 34. Is a meeting code currently validated by the backend?

**Answer:**  
Not in the active video flow. The frontend navigates to a meeting URL and Socket.IO creates a room dynamically. The Express `/meetings` routes exist, but the current frontend does not call them for joining.

### 35. What is the purpose of the `/meetings` backend routes?

**Answer:**  
They are intended for database-backed meeting creation, lookup, joining, and deletion. In the current implementation, they are not part of the active frontend meeting flow.

### 36. What would you improve in the meeting validation flow?

**Answer:**  
I would make the frontend call `GET /meetings/:meetingCode` before joining and `POST /meetings/:meetingCode/join` when the participant enters. The backend would verify that the meeting exists, is active, and the user has permission to join.

### 37. How would you secure Socket.IO connections?

**Answer:**  
I would authenticate the socket handshake using the session cookie or a short-lived token, verify the user before allowing `join-call`, validate the room code, and authorize events such as screen sharing, chat, and meeting deletion.

### 38. What security issue exists in the current CORS configuration?

**Answer:**  
Although it checks `allowedOrigin`, the callback ultimately returns `callback(null, true)` for every origin. That effectively allows all origins. In production, I would allow only the known frontend origin.

### 39. How would you improve chat persistence?

**Answer:**  
I would store messages in MongoDB or another persistent database with fields for meeting ID, sender ID, message content, and timestamp. For high-volume chat, a database such as Redis, PostgreSQL, or a dedicated messaging service could be used.

### 40. How would you test this application?

**Answer:**  
I would test authentication, API routes, session persistence, unauthorized access, Socket.IO room joining, participant disconnects, chat delivery, WebRTC negotiation, screen sharing, mobile browsers, and deployment-specific HTTPS/CORS behavior.

### 41. What was one difficult bug you solved?

**Answer:**  
A deployment bug caused the backend to connect to local MongoDB because the environment file was not loaded from its actual location. I fixed the dotenv path and configured Render environment variables. I also changed the frontend from a hardcoded localhost API URL to a production-aware URL.

### 42. What would you improve first if given more time?

**Answer:**  
I would remove duplicated comments and unused code, add automated tests, authenticate Socket.IO connections, persist meeting data properly, validate meeting codes through the backend, restrict CORS, and replace the peer-to-peer mesh with an SFU for larger meetings.

# More Advanced Questions

## Advanced Interview Questions

### 1. What architecture did you use for this application?

**Answer:**  
The application uses a React frontend, an Express/Node.js backend, MongoDB for user and history data, Passport.js for authentication, Socket.IO for signaling and chat, and WebRTC for peer-to-peer media communication.

The architecture is mainly:

```text
React client
   |
HTTP APIs ───── Express backend ───── MongoDB
   |
Socket.IO signaling ───── WebRTC peer-to-peer media
```

The backend handles authentication, sessions, history, signaling, and room coordination. The actual audio and video streams travel directly between browsers.

### 2. Why did you separate HTTP APIs from Socket.IO communication?

**Answer:**  
HTTP is appropriate for request-response operations such as login, signup, logout, and history. Socket.IO is better for continuous, event-driven communication such as signaling, participant updates, and chat messages.

This separation keeps persistent application data and real-time communication conceptually independent.

### 3. What are the main architectural trade-offs in your design?

**Answer:**  
The peer-to-peer design reduces server bandwidth and media-processing cost, but each browser must maintain a connection with every other participant. It works well for small meetings but does not scale efficiently for large meetings.

The architecture is simple to develop, but production systems would require stronger persistence, authentication, observability, and horizontal-scaling support.

### 4. Which data belongs in the database and which data belongs in memory?

**Answer:**  
Users, passwords, meeting history, and potentially meeting metadata belong in MongoDB. Temporary socket IDs, active room membership, and live signaling state can exist in memory for a single-server deployment.

For production, room state and important real-time data should use shared infrastructure such as Redis so multiple backend instances can access it.

### 5. What happens if your backend server restarts during a meeting?

**Answer:**  
The Socket.IO connections are lost, so signaling stops and the in-memory room data disappears. Users would need to reconnect and renegotiate their WebRTC connections.

The media connection might continue briefly in some cases, but the application should treat the session as interrupted and reconnect cleanly.

### 6. How would you make the system highly available?

**Answer:**  
I would run multiple backend instances behind a load balancer, use Redis for Socket.IO coordination, use MongoDB Atlas for persistent data, add health-check endpoints, and deploy instances across availability zones.

The system would also need graceful reconnect behavior on the frontend.

### 7. How would Socket.IO work across multiple backend instances?

**Answer:**  
I would use the Socket.IO Redis adapter. It synchronizes room events between backend instances.

The load balancer would distribute connections, while Redis would ensure that an event emitted by one instance reaches users connected to another instance.

### 8. Would sticky sessions be required?

**Answer:**  
They may be needed when using long-polling because successive polling requests can reach different instances. Using WebSocket-only transport can reduce that dependency, but the deployment still needs correct Socket.IO scaling configuration.

The exact choice depends on the load balancer and Socket.IO transport setup.

### 9. What is the scaling limitation of your WebRTC design?

**Answer:**  
It uses a full mesh topology. With $n$ participants, every participant may need up to $n - 1$ peer connections, producing approximately $O(n^2)$ relationships.

Bandwidth, CPU usage, signaling traffic, and connection-management complexity increase rapidly as participants join.

### 10. How would you support a meeting with hundreds of participants?

**Answer:**  
I would replace the mesh architecture with an SFU, such as mediasoup, LiveKit, Janus, or Jitsi.

Each participant would upload one media stream to the SFU. The SFU would forward selected streams to other participants, avoiding a separate direct connection between every pair of users.

### 11. When would you choose an MCU instead of an SFU?

**Answer:**  
I would choose an MCU if clients needed to receive one composited stream, such as for a recording, broadcast, or low-powered device.

An MCU mixes media on the server, but it requires more CPU and usually introduces more processing overhead than an SFU.

### 12. How would you decide which participant videos to send?

**Answer:**  
I would implement active-speaker detection, video-quality adaptation, pagination, and subscription policies. Participants might receive high-quality video for the active speaker and low-quality thumbnails for others.

The system could also pause video streams that are outside the visible viewport.

### 13. How would you improve network reliability?

**Answer:**  
I would configure both STUN and TURN servers. STUN helps discover public network addresses, while TURN relays media when direct peer-to-peer connectivity fails because of restrictive NAT or firewalls.

The current project only configures a public STUN server, so some networks may still fail.

### 14. How would you handle poor bandwidth?

**Answer:**  
I would use WebRTC’s bandwidth estimation, simulcast, adaptive bitrate, lower video resolutions, and audio prioritization. The application could reduce video quality or disable video while preserving audio.

An SFU would make this easier because it can send different quality layers to different users.

### 15. How would you secure Socket.IO connections?

**Answer:**  
I would authenticate the Socket.IO handshake using the existing session or a short-lived token. On the server, I would verify the user before accepting `join-call`.

I would also validate room identifiers, authorize chat and meeting actions, limit event frequency, and reject malformed signaling payloads.

### 16. Is the current room identifier secure?

**Answer:**  
No. The current room is based on the frontend URL, which is convenient but predictable and client-controlled.

A stronger design would use a server-generated random meeting ID, validate it against the database, and verify that the user is allowed to join before placing the socket in the room.

### 17. How would you prevent unauthorized users from joining a meeting?

**Answer:**  
The backend should validate the meeting code, check whether the meeting exists and is active, verify the user’s permissions, and optionally require a meeting password or invitation token.

The socket should only join the Socket.IO room after those checks succeed.

### 18. How would you prevent abuse of chat and signaling events?

**Answer:**  
I would add payload validation, maximum message sizes, rate limiting, authentication, and per-room authorization. Chat content should also be sanitized before rendering.

For larger deployments, rate limiting could be coordinated through Redis.

### 19. How would you design observability for this system?

**Answer:**  
I would add structured logs, request IDs, metrics, and distributed tracing. Important metrics would include active rooms, participants per room, socket connection failures, signaling latency, ICE failures, reconnect rates, and WebRTC connection states.

Errors should be captured centrally using a service such as Sentry or OpenTelemetry-compatible tooling.

### 20. How would you evolve this project into a production-grade platform?

**Answer:**  
I would:

- Move from mesh WebRTC to an SFU.
- Add TURN servers.
- Authenticate Socket.IO handshakes.
- Validate meetings through backend APIs.
- Store meeting metadata and chat persistently.
- Use Redis for shared real-time state.
- Add rate limiting and strict CORS.
- Add monitoring, logging, automated tests, and CI/CD.
- Deploy multiple backend instances with health checks.
- Add reconnect and degraded-network handling on the frontend.