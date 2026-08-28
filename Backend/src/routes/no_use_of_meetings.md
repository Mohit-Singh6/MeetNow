The meetings feature works through **Socket.IO**, not the Express `/meetings` API routes.

Current flow:

1. User enters a meeting code.
2. Frontend navigates to a frontend route:

```js
navigate(`/${meetingCode}`);
```

3. `App.jsx` matches it with:

```jsx
<Route path='/:url' element={<VideoMeet />} />
```

4. `VideoMeet` connects to Socket.IO using the backend URL:

```js
io(serverUrl, {
    withCredentials: true
});
```

5. It sends the current frontend URL as the room name:

```js
socket.emit("join-call", window.location.href);
```

6. `socketManager.js` creates or joins the Socket.IO room and handles WebRTC signaling.

So the real meeting flow is:

```text
Frontend /:meetingCode
        ↓
VideoMeet component
        ↓
Socket.IO join-call
        ↓
WebRTC video/audio connection
```

The backend `/meetings` routes are currently unused by this frontend:

```text
POST   /meetings/
GET    /meetings/:meetingCode
POST   /meetings/:meetingCode/join
DELETE /meetings/:meetingCode
```

You can remove them without breaking the current video meeting feature, provided no external client or future code uses them. You would also need to remove:

- The `/meetings` router mount from `app.js`
- The import of `meetingRouter`
- The unused `meeting.js` route file
- The unused meeting controller functions
- Potentially the `Meeting` model if it is not used elsewhere

However, do not remove `/user/history`. The frontend currently uses it to save and load meeting history:

```text
POST /user/history
GET  /user/history
```

Also, removing `/meetings` means the application will no longer have database-backed meeting validation, creation, password checking, or deletion. The current Socket.IO system only creates temporary rooms based on the frontend URL; it does not use the `Meeting` MongoDB model.