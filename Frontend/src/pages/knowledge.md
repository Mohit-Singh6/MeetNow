## Use Ref

Think of `useRef` as a **"Secret Notepad"** that React doesn't watch. 

While `useState` is like a **"Public Billboard"** (everyone sees it, and the whole town re-renders when it changes), `useRef` lets you store data quietly in the background.

### 1. Why not `useState`?
**Every time you update `useState`, the component re-renders.** If you have a value that changes 60 times a second (like a timer or a scroll position) but doesn't need to be drawn on the screen immediately, using `useState` will lag your app because it forces React to redraw the UI 60 times a second. `useRef` updates **without** a re-render.

### 2. Why not a "Normal Variable" (`let x = 0`)?
**Normal variables "die" when a component re-renders.**
If your component re-renders because of *some other* state change, a normal variable inside the function is re-initialized to its starting value. `useRef` **persists**; it remembers its value for the entire life of the component, even across re-renders.

---

### Comparison Table

| Feature | `useState` | `useRef` | Normal `let` |
| :--- | :--- | :--- | :--- |
| **Triggers Re-render?** | Yes ✅ | No ❌ | No ❌ |
| **Persists after Render?** | Yes ✅ | Yes ✅ | No ❌ |
| **Best For...** | UI data (text, lists) | Logic/Internal data | Temporary calculations |



### The "Killer" Use Case: DOM Access
The most common use for `useRef` is talking to HTML elements directly. Since React handles the DOM, you can't easily use `document.getElementById`. Instead, you "hook" a ref onto an element (like your `<video>` tags) so you can call methods like `.play()` or `.focus()` directly on them.





---
---
---





## Navigator (navigator.mediaDevices.getUserMedia({video: true}))

In short, `navigator` is a built-in **JavaScript object** that represents the state and identity of the user's browser (the "User Agent"). It acts as a bridge between your code and the physical hardware or software capabilities of the device.

### What is it used for in your code?
In your video call app, you are specifically using `navigator.mediaDevices`. This is the "Hardware Manager" of the browser. It handles permissions and provides access to cameras, microphones, and screen sharing.

---

### What else does it contain?
The `navigator` object is packed with information about the user's environment. Here are the most useful properties:

| Property | Purpose | Example Use Case |
| :--- | :--- | :--- |
| **`.mediaDevices`** | Hardware access | Getting the Camera/Mic stream (`getUserMedia`). |
| **`.clipboard`** | Copy/Paste | Let users click a button to "Copy Meeting Link." |
| **`.onLine`** | Network status | Show a "You are offline" warning if Wi-Fi drops. |
| **`.geolocation`** | GPS Location | Finding the user's city (with permission). |
| **`.userAgent`** | Browser Info | Checking if the user is on Chrome, Safari, or Mobile. |
| **`.language`** | Local Settings | Automatically showing your app in Hindi or English. |



---

### Why is it useful?
1.  **Hardware Control:** It is the *only* way for a website to talk to your physical camera or speakers.
2.  **Adaptive UX:** You can use it to detect if a user is on a slow mobile connection or a desktop and adjust the video quality accordingly.
3.  **Security:** It manages the "Permissions" pop-ups. You can't just take a video; `navigator` forces the browser to ask the user first.

### A Simple "Pro" Tip
Since you are building a meeting app, you can use `navigator.onLine` to prevent your socket from trying to reconnect when there is no internet at all, saving battery and CPU.

```javascript
if (navigator.onLine) {
    console.log("We are connected to the internet!");
} else {
    alert("Check your connection!");
}
```

Would you like to see how to use `navigator.clipboard` to make a "Copy Link" button for your meeting room?