import React, { useRef, useState, useEffect } from 'react';
import io from "socket.io-client";
import '../styles/videoMeet.css';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';


const serverUrl = 'http://localhost:3000';

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

/*
  Stores RTCPeerConnection objects per socketId

  Structure:
  {
    socketId1: RTCPeerConnection,
    socketId2: RTCPeerConnection
  }

  Why NOT use useState?
  - These objects are heavy
  - Updating them should NOT re-render UI
*/



export default function VideoMeet() {

    let connectionsRef = useRef({});


    let pendingIceCandidatesRef = useRef({}); /** ICE payloads received before setRemoteDescription; keyed by remote socket id 
     The Problem: The "Race Condition"

In your original code, when a user joined, two types of data started flying across the internet simultaneously:

    The SDP (The Handshake): Large data about video formats.

    ICE Candidates (The Path): Small bits of data about IP addresses.

The Crash/Failure Logic:
In WebRTC, a browser cannot accept an ICE Candidate until it has finished processing the SDP (setRemoteDescription).

    Original Code: If an ICE candidate arrived even 1 millisecond before the SDP finished loading, your code would try to add it, the browser would reject it (because it didn't know who the candidate belonged to yet), and the connection would simply stay black. No error was thrown because the "bridge" just never finished building. 
    */


    let usingSyntheticLocalRef = useRef(false);
    // false - You are using the "Real" Camera/Mic Stream.
    // true - You are using the "Fake" (Black/Silent) Stream.
    // It prevents the code from trying to "stop" hardware that isn't running. If it's true, the app knows your actual camera is still "resting," so it won't throw errors when you try to switch to the real one.

    let skipNextGetUserMediaRef = useRef(false);
    /** Avoid double getUserMedia when tryAcquireRealMedia already applied a stream. */
    // The Problem it Solves
    // In React, you have a useEffect that "watches" your video/audio buttons. Every time you toggle a button, it calls getUserMedia.
    //     You click "Connect": This triggers tryAcquireRealMediaAfterPermission.
    //     Manually Getting Stream: That function successfully gets your camera and then updates the video and audio states (e.g., setting them to true).
    //     The Trigger: Because the video state changed, the useEffect at the bottom of your code sees the change and says, "Hey, the state changed! I must run getUserMedia now!"
    //     The Loop: getUserMedia runs again, even though you just got the stream in the previous step. This causes the camera to blink, waste resources, or reset your connection.


    let socketRef = useRef(); // Reference to socket object
    let socketIdRef = useRef(); // Stores the socket.id received from server, Used to identify "this user" uniquely

    function flushPendingIceCandidates(peerId) { // It goes to the "Waiting Room," grabs all those early candidates that were stuck, and plugs them into the connection in the correct order.
        const pc = connectionsRef.current[peerId];
        const queue = pendingIceCandidatesRef.current[peerId];
        if (!pc || !queue?.length) return;
        pendingIceCandidatesRef.current[peerId] = [];
        queue.forEach((init) => {
            try {
                const c = init === null ? null : new RTCIceCandidate(init);
                pc.addIceCandidate(c).catch((e) =>
                    console.error("[videoMeet] flush addIceCandidate", e)
                );
            } catch (e) {
                console.error("[videoMeet] flush ICE", e);
            }
        });
    }

    function addIceOrQueue(peerId, candidateInit) { // This function acts as a Traffic Controller.
        // Line: if (!pc.remoteDescription) { ... push(candidateInit) }
        // Use: It checks: "Has the handshake (SDP) finished yet?"
        // Logic: If NO, it puts the candidate into the pendingIceCandidatesRef waiting room. If YES, it adds it to the connection immediately. This ensures zero candidates are lost.

        const pc = connectionsRef.current[peerId];
        if (!pc) return;
        if (!pc.remoteDescription) {
            if (!pendingIceCandidatesRef.current[peerId]) {
                pendingIceCandidatesRef.current[peerId] = [];
            }
            pendingIceCandidatesRef.current[peerId].push(candidateInit);
            return;
        }
        try {
            const c = candidateInit === null ? null : new RTCIceCandidate(candidateInit); // In WebRTC, sending null is a specific signal meaning "I have no more network paths to send." * If you try to pass null directly into new RTCIceCandidate(), the code will crash.
            // This ternary operator checks for null first to prevent that crash while still allowing the "End of Candidates" signal to pass through safely.

            pc.addIceCandidate(c).catch((e) =>
                console.error("[videoMeet] addIceCandidate", e)
            );
        } catch (e) {
            console.error("[videoMeet] addIceCandidate build", e);
        }
    }

    // const ref = useRef(initialValue);

    // It returns an object:

    // {
    //   current: initialValue
    // }

    // Two key properties (memorize these):
    //     ref.current can be changed
    //     Changing it does NOT cause a re-render

    // That second point is the entire reason useRef exists.

    // Sometimes you want:
    // To store a value
    // To persist it across renders
    // Without triggering re-renders


    let localVideoRef = useRef(); // khud ka video, Reference to <video> element for local camera

    let [videoAvailable, setVideoAvailable] = useState(false); // do we have the video access (hardware wise)
    let [audioAvailable, setAudioAvailable] = useState(false); // do we have the audio access (hardware wise)

    let [video, setVideo] = useState(true); // video is on or off
    let [audio, setAudio] = useState(true); // audio is on or off

    let [screenShare, setScreenShare] = useState(false); // screen sharing on or off

    let [showModal, setShowModal] = useState(false);
    // Generic modal control
    // Used later for settings / alerts

    let [screenShareAvailable, setScreenShareAvailable] = useState(true); // screen sharing hardware wise

    let [messages, setMessages] = useState([]); // chat messages (list)
    let [message, setMessage] = useState(''); // current message being typed

    let [newMessage, setNewMessage] = useState(0); // new message indicator

    let [askForUsername, setAskForUsername] = useState(true); // ask for username modal
    // What is the problem?
    // Inside a function like gotMessageFromServer or socket.on("user-joined"), React's useState (askForUsername) can get "stuck" on the value it had when the listener was first created. Even if you update the state to false, the socket listener might still think it's true. This is called a closure stall.

    const askForUsernameRef = useRef(true);
    //     The Solution: State + Ref Sync
    // By using both a State and a Ref together, you get the best of both worlds:
    //     let [askForUsername, setAskForUsername] = useState(true);
    //         The UI Controller: This is used for the return statement. When this changes, React re-renders the screen (e.g., hiding the lobby and showing the meeting).

    askForUsernameRef.current = askForUsername;
    //     askForUsernameRef.current = askForUsername;
    //         The "Always Fresh" Value: Unlike state, a useRef object is a consistent "box" in memory. By updating .current every time the state changes, you ensure that any socket listener can look into that box and see the most current value immediately, without needing a re-render.



    let [username, setUsername] = useState(''); // username state

    const videoRef = useRef({}); // sabki video references (0bject, key is socketId)
    // References to all remote video elements
    // Example:
    // videoRef.current[socketId] = videoElement

    let [videos, setVideos] = useState([]); // sabki videos
    // Used to trigger re-render when participants change


    // ONLY FOR DEBUGGING AND STORING THESE EXTRA THINGS:        
    /** Server-reported socket ids in this room (from each user-joined payload). */
    let [roomClientIds, setRoomClientIds] = useState([]); // roomClientIds is a "clean" list of strings (Socket IDs) provided directly by the server.
    let [mySocketId, setMySocketId] = useState('');
    /** Per-peer WebRTC states for debugging (keys = remote socket ids). */
    let [peerDiagnostics, setPeerDiagnostics] = useState({}); // This state stores the technical connectionState for every single peer in the room.
    // The Use: This is for Debugging. It allows you to show a little "signal strength" icon or a status label (like "Connecting...") under each person's video. If a user's video is black, you can look at this state to see if the ICE handshake actually finished.


    // Stores your own camera + mic stream
    // Needed so we can attach it to peer connections
    const localStreamRef = useRef(null);


    async function getUserPermissions() { // async is needed because browser permission requests are asynchronous
        // Camera/mic access is not instant
        try {
            // Ask browser for camera + mic permission - “Can I use your camera and microphone?”
            // If user allows → returns a MediaStream

            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            // When you call navigator.mediaDevices.getUserMedia(), it doesn't return a simple "false" or "null" if things go wrong. Instead, it throws an Error (technically a rejected Promise).

            if (videoPermission) { // the video access was allowed, so set videoAvailable to true
                setVideoAvailable(true);
            }
            if (audioPermission) { // the audio access was allowed, so set audioAvailable to true
                setAudioAvailable(true);
            }
            if (navigator.mediaDevices.getDisplayMedia) { // Check for screen sharing availability
                setScreenShareAvailable(true);
            } else {
                setScreenShareAvailable(false);
            }

            if (videoPermission || audioPermission) { // don't use videoAvailable or audioAvailable here, because those values are still false, they will refresh after this completes
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: !!videoPermission, audio: !!audioPermission }); // why video: videoAvailable? not video: true, because only get things if they are available.
                // Use double-bang(!!) to convert stream to boolean value (optional)

                if (userMediaStream) { // just to be safe
                    window.localStream = userMediaStream;
                    usingSyntheticLocalRef.current = false;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
                /* 
                    Here is the breakdown of each line:

                    ### 1. `window.localStream = userMediaStream;`
                    * **The Use:** This attaches your camera/mic stream to the **Global Window Object**.
                    * **Why?** In a large project, you might need to access your camera stream from a different file or a utility function that isn't inside this React component. By putting it on `window`, you make it accessible anywhere in your browser tab by just typing `window.localStream`. 
                    * **Warning:** In professional React apps, we usually avoid this and use `useRef` or `Context` instead, as global variables can lead to bugs.

                    ### 2. `if (localVideoRef.current)`
                    * **The Use:** This is a **Safety Check** to see if your `<video>` element actually exists in the DOM yet.
                    * **Why?** React is fast. Sometimes your code tries to "talk" to a video element before React has finished drawing it on the screen. If you try to attach a stream to a `null` element, your app will crash with the error: *"Cannot set property srcObject of null."*

                    ### 3. `localVideoRef.current.srcObject = userMediaStream;`
                    * **The Use:** This is the most critical line—it **starts the live feed**.
                    * **What it means:** * `srcObject` is a special property for `<audio>` and `<video>` tags. 
                        * Normally, a video tag uses a `src` (like `src="movie.mp4"`). But since a camera feed is a **live object** (a `MediaStream`), not a static file, you must use `srcObject` to link them.
                        * Think of `srcObject` as the **"Plug"** and `userMediaStream` as the **"Electricity."** This line plugs the live camera data into your visual player.

                    ---

                */

            }

        }
        // If user denies / device missing → throws error
        catch (err) {
            // If permission denied or hardware missing
            setVideoAvailable(false);
            setAudioAvailable(false);
            console.log(err);
        }
    }


    // black silence: These two functions are "Fake Media Generators." They are used in video apps to create a silent audio track and a black video track when a user doesn't have a camera or microphone, or when they turn them off.
    // This prevents the WebRTC connection from breaking by providing a "dummy" stream to keep the pipe open.

    let silence = () => { // This function uses the Web Audio API to create an audio track that contains no sound.
        let ctx = new AudioContext(); // Creates the "engine" for audio processing in the browser.
        let oscillator = ctx.createOscillator(); // Creates a source that generates a constant tone (like a beep).

        let dst = oscillator.connect(ctx.createMediaStreamDestination()); // Connects that "beep" to a special "Destination" that turns the audio into a MediaStream (the same format as a microphone).

        oscillator.start(); // Turns the sound generator on.
        ctx.resume(); // Ensures the audio engine is actually running (browsers often pause it by default).
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false }); // Logic: It takes the first audio track from our fake stream and sets enabled: false.
        // Use: This returns a track that technically exists but is "muted," providing perfectly clean silence to the other peers.
    }

    // This function creates a blank image and turns it into a video stream.
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height }); // Creates an invisible "drawing board" (HTML5 Canvas) in memory with specific dimensions (default 640x480).

        canvas.getContext('2d').fillRect(0, 0, width, height); // This paints the entire canvas black.

        let stream = canvas.captureStream(); // This is the "magic" line. It tells the browser: "Start recording this canvas as if it were a live video camera."
        return Object.assign(stream.getVideoTracks()[0], { enabled: false }); // It grabs the first video track from the canvas recording and sets enabled: false.
        // Use: This returns a "Black" video track. Even if it's disabled, having the track present stops the remote <video> element from showing an "Error" or a broken icon.
    }

    // Why use Object.assign?

    // You see Object.assign used a lot here. It is a shortcut to create an object and set its properties in one line.
    // Example: Object.assign(document.createElement("canvas"), { width, height}) creates the canvas and immediately sets its width and height.


    /*
        This effect checks media device availability ONCE
        Runs when component mounts
    */
    useEffect(() => {
        getUserPermissions();
    }, []);


    // This function is a "Hot-Swapping" utility. Its job is to update an existing connection with new video or audio tracks (like switching from a front to a back camera) without dropping the call.
    // It intelligently decides: "Should I create a new 'pipe' for this track, or just swap the data inside the existing one?"
    let addOrReplaceLocalTracksOnPc = (pc, mediaStream) => {
        const senders = pc.getSenders(); // Gets a list of all active "data pushers" (Senders) currently attached to this specific peer connection.
        mediaStream.getTracks().forEach((track) => { // Loops through every individual track (Video and Audio) inside the new stream you want to use.
            const sender = senders.find((s) => s.track?.kind === track.kind); // Checks if there is already a sender for that type (e.g., "Am I already sending video?").
            if (sender) {
                sender.replaceTrack(track).catch((e) => console.log(e)); // If a sender exists, it swaps the video source instantly. This prevents the connection from flickering or requiring a new "handshake."

            } else { // If no sender exists (like your mic was previously totally off), it builds a new "pipe" for that track.
                try {
                    pc.addTrack(track, mediaStream);
                } catch (err) {
                    console.log(err);
                }
            }
        });
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream?.getTracks?.().forEach((track) => track.stop()); // Before starting the new video, it tries to find any old camera "tracks" that might be running and kills them.
            // The Reason: This prevents "memory leaks" where your camera stays on in the background even when you switch settings.
        } catch (err) {
            console.log(err);
        }

        // It saves the fresh camera data to a global variable and plugs it into your local video box so you can see yourself.
        window.localStream = stream;
        usingSyntheticLocalRef.current = false;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        for (let id in connectionsRef.current) { // This is the most important part. Now that your camera is on, you loop through every person in the room and re-negotiate the call.
            if (id === socketIdRef.current) continue;

            const pc = connectionsRef.current[id];
            addOrReplaceLocalTracksOnPc(pc, stream);

            pc.createOffer() // Your browser generates a Session Description (SDP).
                // The Use: Think of this as a "Digital Resume." It contains information like: "I support VP8 video, here is my IP address, and I want to send you 1 audio and 1 video track."
                .then((description) => {  // Since creating an offer takes a bit of time (it has to check your hardware), it returns a Promise. Once the "resume" (description) is ready, this function runs.
                    pc.setLocalDescription(description) // You "save" this resume to your own side of the connection.
                        // The Use: You are telling your browser: "This is the configuration I am officially committing to for this specific call."
                        .then(() => {
                            const ld = pc.localDescription;
                            socketRef.current.emit("signal", { to: id, sdp: ld ? { type: ld.type, sdp: ld.sdp } : undefined });
                            // The Use: Since you can't talk to the other person yet, you give the message to the Mailman (Socket.io) and say: "Please deliver this 'Offer' to the person with this ID so they know I want to connect."

                            // JSON.stringify({"sdp": ...}) => You turn the JavaScript object into a JSON String.
                            // The Use: Sockets prefer sending text rather than complex objects. You specifically label it as "sdp" so the receiver knows this is a "Session Description."
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                })

        }

        stream.getTracks().forEach(track => track.onended = () => { // The Logic: This attaches a listener to your camera hardware. It detects if the camera physically stops (e.g., you unplug your USB webcam or the browser revokes permission).
            // The Reaction: 1. It sets your video/audio states to false (updates the UI buttons).
            // 2. It loops through all participants and sends a new Offer without the stream.

            // The Result: This ensures that if your camera dies, everyone else in the meeting sees a black screen instead of a "frozen" last frame of your face.

            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current?.srcObject?.getTracks();
                if (tracks) tracks.forEach(track => track.stop());
            }
            catch (e) { console.log(e) }


            // BLACKSILENCE
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            usingSyntheticLocalRef.current = true;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = window.localStream;  // Gemini said
                // In your connectToSocketServer code, the goal was just to send something to others. But in getUserMediaSuccess, the goal is to update your own screen as well.
            }

            for (let id in connectionsRef.current) {
                if (id === socketIdRef.current) continue;
                const pc = connectionsRef.current[id];
                addOrReplaceLocalTracksOnPc(pc, window.localStream);
                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description)
                        .then(() => {
                            const ld = pc.localDescription;
                            socketRef.current.emit("signal", { to: id, sdp: ld ? { type: ld.type, sdp: ld.sdp } : undefined });
                        })
                        .catch((e) => console.log(e));
                })
            }
        })
    }


    // This function acts as an Automatic Upgrade Switch.
    // When a user first joins, they might be using a Synthetic Stream (the "Black & Silence" fake video) because they were still in the lobby or hadn't granted permissions yet. Once they are officially in the call and the browser finally allows hardware access, this function automatically "promotes" the connection from the fake placeholder to the real camera and microphone without the user having to manually refresh or click "Connect" again.
    async function tryAcquireRealMediaAfterPermission() {
        if (askForUsernameRef.current || !usingSyntheticLocalRef.current) return;
        if (!socketRef.current?.connected) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            skipNextGetUserMediaRef.current = true;
            setVideoAvailable(stream.getVideoTracks().length > 0);
            setAudioAvailable(stream.getAudioTracks().length > 0);
            setVideo(!!stream.getVideoTracks().length);
            setAudio(!!stream.getAudioTracks().length);
            getUserMediaSuccess(stream); // This calls your existing success function which plugs this new real stream into the local video box and tells all other participants (via Socket/SDP) to look at your real face instead of a black box.
        } catch (e) {
            console.log("[videoMeet] tryAcquireRealMediaAfterPermission", e);
        }
    }

    const tryAcquireRealMediaFnRef = useRef(tryAcquireRealMediaAfterPermission);
    tryAcquireRealMediaFnRef.current = tryAcquireRealMediaAfterPermission;


    let getUserMedia = () => { // you can implemenet this with async await too.
        if (skipNextGetUserMediaRef.current) { // It checks the "Do Not Disturb" sign (skipNextGetUserMediaRef).
            // The Use: It asks: "Did we just manually update the media somewhere else and specifically asked to skip this automatic check?"
            skipNextGetUserMediaRef.current = false; // This ensures that the "skip" only happens once. The next time you toggle a button normally, the function will be allowed to run again. It’s like a one-time-use coupon.
            return;
        }
        if ((videoAvailable && video) || (audioAvailable && audio)) { // if video is available and turned on then only get the userMedia and same goes for audio
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })  // If video is true and audio is false, it kills the old stream and gives you a video-only stream. (and similarly other cases)
                .then(getUserMediaSuccess)
                .catch((err) => { console.log(err) });
        }
        else {
            try {
                let tracks = localVideoRef.current?.srcObject?.getTracks(); // find all tracks of local video ref (current user's on;y) (video and audio)
                if (tracks) tracks.forEach((track) => { track.stop() }); // stop the tracks (video and audio), camera light turns off.
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    let gotMessageFromServer = (payload) => {
        const fromId = payload?.from;
        if (fromId === undefined || fromId === socketIdRef.current) return;

        const sdp = payload.sdp; // SDP (Session Description Protocol): This is the "What." It tells the other person what video formats you support.
        const candidate = payload.candidate; // Candidate (ICE Candidate): This is the "How." It tells the other person which IP address and port to use to find you.

        // The Debug Logger - This is a "Developer's Black Box." Since WebRTC happens behind the scenes, if a connection fails, you won't know why just by looking at the screen.
        console.log("[videoMeet] signal", {
            from: fromId, // Tells you exactly which user is trying to talk to you.
            sdpType: sdp?.type, // Tells you if you are receiving an Offer (someone starting a call) or an Answer (someone accepting your call).
            hasCandidate: candidate != null, // Tells you if network path data is actually arriving. If this is always false, you know your ICE gathering is broken.
        });

        //This block of code is the "Handshake Receiver." Its job is to process incoming technical information (SDP and ICE) from another user to build a live video connection.
        if (sdp && connectionsRef.current[fromId]) { // It ensures we only proceed if we actually have incoming session data (sdp) and a pre-existing "pipe" (connectionsRef) for that specific user.
            connectionsRef.current[fromId]
                .setRemoteDescription(new RTCSessionDescription(sdp)) // This takes the other person's media configuration (their "proposal" for video/audio formats) and saves it to your local connection.
                .then(() => {
                    flushPendingIceCandidates(fromId);

                    if (sdp.type === "offer") {
                        const pc = connectionsRef.current[fromId];
                        if (window.localStream) {
                            window.localStream.getTracks().forEach((track) => { // Before you send your response, you "plug in" your own microphone and camera tracks into this specific peer's connection. This ensures they can see and hear you.
                                try {
                                    pc.addTrack(track, window.localStream);
                                } catch (err) {
                                    /* already added when user-joined created this PC */
                                }
                            });
                        }

                        pc.createAnswer() // Your browser creates a response ("Answer") saying, "I agree to these formats, and here are my details." setLocalDescription then locks that response into your own connection settings.
                            .then((description) => {
                                return pc.setLocalDescription(description);
                            })
                            .then(() => {
                                const ld = pc.localDescription;
                                socketRef.current.emit("signal", {
                                    to: fromId,
                                    sdp: ld ? { type: ld.type, sdp: ld.sdp } : undefined,
                                });
                            })
                            .catch((e) => console.log(e));
                    }
                })
                .catch((e) => console.log(e));
        }

        if (candidate !== undefined && connectionsRef.current[fromId]) {
            addIceOrQueue(fromId, candidate);
        }
    }

    
    let addMessage = (data, sender, socketIdSender) => {
            
        // --- 1. DATA NORMALIZATION (THE "CLEANER") ---
        // This complex ternary block ensures the app doesn't crash if 'data' is an object or a string.
        const normalizedMessage =
            typeof data === "string"            // Check: Is 'data' just a simple string?
                ? data.trim()                   // If yes: Remove extra spaces and use it.
                : typeof data?.message === "string" // Check: Is it an object with a .message property?
                    ? data.message.trim()       // If yes: Use that string.
                    : typeof data?.data === "string" // Check: Is it an object with a .data property?
                        ? data.data.trim()      // If yes: Use that string.
                        : "";                   // Final fallback: Use an empty string if nothing matches.

        // --- 2. VALIDATION ---
        // If the resulting message is empty (only spaces or undefined), stop the function.
        // This prevents empty chat bubbles from appearing in your UI.
        if (!normalizedMessage) return;

        // --- 3. DEBUG LOGGING ---
        // Logs the cleaned message and sender info to the console for developer tracking.
        console.log(normalizedMessage, sender, socketIdSender);

        // --- 4. STATE UPDATE (UI) ---
        // We use the functional update (prev) to ensure we have the absolute latest list of messages.
        // This prevents "Stale Closure" where new messages accidentally overwrite old ones.
        setMessages((prev) => [...prev, { data: normalizedMessage, sender: sender }]);

        // --- 5. NOTIFICATION LOGIC ---
        // 'socketIdRef.current' is your unique ID. 
        // If the sender's ID is DIFFERENT than yours, it means someone else sent this.
        if (socketIdSender !== socketIdRef.current) { 
            // Increment the 'unread message' counter (e.g., to show a red dot or badge).
            setNewMessage((prev) => prev + 1)
        }

        // --- 6. LOGGING STATE ---
        // Note: These logs might show "old" values because React state updates are asynchronous.
        console.log(messages, newMessage);
    }


    let connectToSocketServer = () => {
        if (socketRef.current) {
            try {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
            } catch (e) {
                console.log(e);
            }
        }

        const socket = io(serverUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect_error", (err) => {
            console.error("[videoMeet] socket connect_error", err?.message || err);
            setMySocketId("");
        });

        socket.on("disconnect", (reason) => {
            console.warn("[videoMeet] socket disconnect", reason);
        });

        socket.on("signal", gotMessageFromServer);


            // THIS PART BELOW WAS COMMENTED

        // socket.on("chat-message", (data, sender, socketIdSender) => {
        //     if (
        //         data &&
        //         typeof data === "object" &&
        //         !Array.isArray(data) &&
        //         sender === undefined
        //     ) {
        //         addMessage(data.data ?? data.message, data.sender, data.senderSocketId);
        //         return;
        //     }

        //     addMessage(data, sender, socketIdSender);
        // });

        socket.on("chat-message", addMessage);

        socket.on("user-left", (id) => {
            console.log("[videoMeet] user-left", id);
            if (connectionsRef.current[id]) {
                try {
                    connectionsRef.current[id].close();
                } catch (e) {
                    console.log(e);
                }
                delete connectionsRef.current[id];
            }
            delete pendingIceCandidatesRef.current[id];
            setPeerDiagnostics((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            setRoomClientIds((prev) => prev.filter((sid) => sid !== id));
            setVideos((prev) => prev.filter((video) => video.socketId !== id));
        });

        socket.on("user-joined", (id, clients) => { // id is socket.id and clients are connections[path] in socketManager(in controllers)
            // When you join (or when someone else joins), the server sends a list of everyone currently in the room (clients). You loop through every single person.

            const clientList = Array.isArray(clients) ? [...clients] : [];
            setRoomClientIds(clientList);
            const others = clientList.filter((sid) => sid !== socketIdRef.current);
            console.log("[videoMeet] user-joined", {
                eventNewUserId: id,
                serverClientList: clientList,
                mySocketId: socketIdRef.current,
                otherParticipantsCount: others.length,
                otherIds: others,
            });

            clientList.forEach((socketListId) => {
                if (socketListId === socketIdRef.current) return;

                const isNewPeer = !connectionsRef.current[socketListId];
                if (isNewPeer) {
                    connectionsRef.current[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    const pc = connectionsRef.current[socketListId];
                    const pushPeerDiag = () => {
                        setPeerDiagnostics((prev) => ({
                            ...prev,
                            [socketListId]: {
                                connectionState: pc.connectionState,
                                iceConnectionState: pc.iceConnectionState,
                            },
                        }));
                    };
                    pc.onconnectionstatechange = pushPeerDiag;
                    pc.oniceconnectionstatechange = pushPeerDiag;
                    pushPeerDiag();

                    connectionsRef.current[socketListId].onicecandidate = (event) => {
                        if (event.candidate != null) {
                            socketRef.current.emit("signal", { to: socketListId, candidate: event.candidate });
                        }
                    };

                    connectionsRef.current[socketListId].ontrack = (event) => {
                        console.log("[videoMeet] ontrack", {
                            peer: socketListId,
                            kind: event.track?.kind,
                            streamCount: event.streams?.length,
                        });
                        setVideos((prev) => {
                            const exists = prev.find((v) => v.socketId === socketListId);
                            let stream = event.streams[0];
                            if (!stream && event.track) {
                                const prevStream = exists?.stream;
                                if (prevStream) {
                                    stream = new MediaStream();
                                    prevStream.getTracks().forEach((t) => stream.addTrack(t));
                                    if (!stream.getTracks().some((t) => t.id === event.track.id)) {
                                        stream.addTrack(event.track);
                                    }
                                } else {
                                    stream = new MediaStream([event.track]);
                                }
                            }
                            if (!stream) return prev;

                            if (exists) {
                                return prev.map((v) =>
                                    v.socketId === socketListId ? { ...v, stream } : v
                                );
                            }
                            return [
                                ...prev,
                                {
                                    socketId: socketListId,
                                    stream,
                                },
                            ];
                        });
                    };
                }









                // THIS PORTION WAS COMMENTED

                // connectionsRef.current[socketListId].onaddstream = (event) => { 

                // ### 1. What is this Event Listener for? (`onaddstream`)

                // Think of the `RTCPeerConnection` as a **physical pipe** you just laid between yourself and another user.
                // * The `onaddstream` event is like the **"Water is Flowing!"** alarm. 
                // * It fires the exact moment the other person's camera data successfully travels through that pipe and reaches your browser. 
                // * Without this listener, the connection would be "active," but you would never actually see their face because you wouldn't know the video data is ready to be handled.

                // ---

                // ### 2. What is in the `event`?

                // The `event` object is a specialized WebRTC event that contains a **`stream`** property.
                // * **`event.stream`**: This is a **MediaStream** object (similar to the `localStream` you got from your own camera). 
                // * It contains the live video and audio tracks from the **remote participant**.
                // * This is the "raw data" that you need to plug into a `<video>` tag so you can see them.

                // ---

                // ### 3. What does `{ ...video, stream: event.stream }` mean?

                // This is JavaScript **Spread Syntax**, and it's used here to update a specific object inside your array of users without losing any existing data.

                // * **`...video`**: This "spreads" (copies) all existing properties of that user (like their `socketId`, `username`, etc.) into a new object.
                // * **`stream: event.stream`**: This adds a new property (or updates the existing one) called `stream` with the fresh video data you just received.

                // **Analogy:** Imagine a folder labeled "Participant A" that already contains their name. `{ ...video, stream: event.stream }` is like taking that folder, making a photocopy of it, and then slipping a DVD (the stream) into the new copy. You kept the name, but now you have the video too.

                // let videoExists = videos.find(video => video.socketId === socketListId);

                // if (videoExists) {
                //     setVideos(videos => {
                //         const updatedVideos = videos.map(video => video.socketId === socketListId ? { ...video, stream: event.stream } : video);
                //         // videoRef.current = updatedVideos;
                //         return updatedVideos;
                //     })
                // }
                // else {
                //     let newVideo = {
                //         socketId: socketListId,
                //         stream: event.stream,
                //         autoPlay: true,
                //         playsInline: true
                //     }

                //     setVideos(videos => {
                //         const updatedVideos = [ ...videos, newVideo ]; // videos is an array that's why square brackets (not curly)
                //         // videoRef.current = updatedVideos;
                //         return updatedVideos;
                //     })
                // };

                // setVideos((prevVideos) => {
                //     const videoExists = prevVideos.find(v => v.socketId === socketListId);

                //     if (videoExists) {
                //         return prevVideos.map(v => 
                //             v.socketId === socketListId ? { ...v, stream: event.stream } : v
                //         );
                //     } else {
                //         return [...prevVideos, {
                //             socketId: socketListId,
                //             stream: event.stream,
                //             autoPlay: true,
                //             playsInline: true
                //         }];
                //     }
                // });
                // };

                if (!isNewPeer) return;

                if (window.localStream !== undefined && window.localStream !== null) {
                    window.localStream.getTracks().forEach((track) => {
                        connectionsRef.current[socketListId].addTrack(track, window.localStream);
                    });
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    usingSyntheticLocalRef.current = true;
                    window.localStream.getTracks().forEach((track) => {
                        connectionsRef.current[socketListId].addTrack(track, window.localStream);
                    });
                }
            })



            // This block of code is the "Initiator" logic. Its purpose is to start the actual WebRTC handshake (the negotiation) by creating an Offer. Without this part, you would have the virtual cables connected, but no data would ever flow because neither side has asked the other to start "talking." - I know it makes no sense!!
            if (id === socketIdRef.current) { // This ensures that only the newly joined user starts the negotiation. If everyone tried to create an offer at the same time, the connections would clash (this is called "glare" in WebRTC).
                for (let id2 in connectionsRef.current) {
                    if (id2 === socketIdRef.current) continue;

                    try {
                        window.localStream.getTracks().forEach(track => {
                            connectionsRef.current[id2].addTrack(track, window.localStream);
                        }); // Ensures your camera/mic is attached to this specific peer's connection. The empty catch ignores the error if the stream was already added in the previous loop.

                        // Why did we addStream again?
                        // You noticed that we already had connections[socketListId].addStream(...) inside the forEach loop.
                        // The Reason:
                        //     The forEach loop runs for everyone else who was already in the room when you joined.
                        //     The if (id === socketIdRef.current) block runs specifically for you (the new joiner) to ensure that your browser initiates the connection to every other peer in the connections object.
                        //     The try...catch around addStream is there because WebRTC will throw an error if you try to add the same stream twice to the same connection. It's a safety net to ensure every peer definitely has your stream before the Offer is created.
                    }
                    catch (err) { }

                    connectionsRef.current[id2].createOffer().then((description) => { // This generates a Session Description (SDP). Think of this as a digital "Resume" that says: "Here are the video formats I support and my network info. Do you want to connect?"
                        connectionsRef.current[id2].setLocalDescription(description) // You tell your own browser: "This is the configuration I am going to use for this call."
                            .then(() => {
                                const ld = connectionsRef.current[id2].localDescription;
                                console.log("[videoMeet] initiator sending offer to", id2);
                                socketRef.current.emit("signal", { to: id2, sdp: ld ? { type: ld.type, sdp: ld.sdp } : undefined });
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
        });

        const joinRoom = () => {
            if (!socket.connected) return;
            socketIdRef.current = socket.id;
            setMySocketId(socket.id);
            console.log("[videoMeet] socket connected, join-call", window.location.href, "my id:", socket.id);
            socket.emit("join-call", window.location.href);
        };

        socket.on("connect", joinRoom);

        if (socket.connected) {
            joinRoom();
        }
    };

    useEffect(() => {
        if (video != undefined && audio != undefined) {
            getUserMedia();
        }
    }, [video, audio])

    useEffect(() => {
        if (askForUsername) return;

        const run = () => {
            tryAcquireRealMediaFnRef.current();
        };

        const onVisibility = () => {
            if (document.visibilityState === "visible") run();
        };
        document.addEventListener("visibilitychange", onVisibility);

        const permCleanups = [];
        if (navigator.permissions?.query) {
            for (const name of ["camera", "microphone"]) {
                navigator.permissions
                    .query({ name })
                    .then((status) => {
                        const onChange = () => {
                            if (status.state === "granted") run();
                        };
                        status.addEventListener("change", onChange);
                        permCleanups.push(() => status.removeEventListener("change", onChange));
                    })
                    .catch(() => { });
            }
        }

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            permCleanups.forEach((fn) => fn());
        };
    }, [askForUsername])

    useEffect(() => {
        // If we are no longer in the lobby and we have a stream saved in window
        if (!askForUsername && window.localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername]); // Run this whenever we switch from lobby to meeting

    let getMedia = () => {
        setVideo(videoAvailable); // agar video available hai to by default initially video will be on.
        setAudio(audioAvailable); // agar audio available hai to by default initially audio/mic will be on.

        // now we have to assign the media to there ........
        connectToSocketServer();
    }

    const [usernameError, setUsernameError] = useState(false);

    let connect = () => {
        if (!username || username.trim() === "") {
            setUsernameError(true);
            return;
        }
        setUsernameError(false);
        setAskForUsername(false);
        getMedia();
    }

    let toggleAudio = () => {
        setAudio(!audio);
    }

    let toggleVideo = () => {
        setVideo(!video);
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks.forEach(track => track.stop()); // we will replace the current video stream with the screensharing stream, for that first we'll stop the current tracks, so that we can replace them.
            // A MediaStream is a "bundle" of hardware connections; simply reassigning the variable doesn't turn off the hardware. By looping through the old tracks and calling .stop(), you officially release the webcam and microphone, which turns off the camera light, saves battery, and prevents memory leaks. This ensures a "clean slate" so the browser doesn't throw "Device in use" errors when you try to switch back to the camera later.
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;

            const pc = connectionsRef.current[id];
            // connectionsRef.current[id].addStream(window.localStream);

            addOrReplaceLocalTracksOnPc(pc, window.localStream);

            pc.createOffer()
                .then((description) => {
                    pc.setLocalDescription(description)
                        .then(() => {
                            const ld = pc.localDescription;
                            socketRef.current.emit("signal", { to: id, sdp: ld ? { type: ld.type, sdp: ld.sdp } : undefined });
                        })
                        .catch((e) => {
                            console.log(e);
                        })
                })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreenShare(false);

            try {
                let tracks = localVideoRef.current?.srcObject?.getTracks();
                if (tracks) tracks.forEach(track => track.stop());
            }
            catch (e) { console.log(e) }


            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            usingSyntheticLocalRef.current = true;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = window.localStream;
            }

            getUserMedia();
            // addOrReplaceLocalTracksOnPc(pc, window.localStream);

        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    useEffect(() => {
        if (screenShare !== undefined && screenShare === true) {
            getDisplayMedia();
        }
    }, [screenShare])

    let toggleScreenShare = () => {
        const newScreenShareValue = !screenShare;
        setScreenShare(newScreenShareValue);

        // If we are TURNING OFF screen share
        if (!newScreenShareValue) {
            // 1. Stop the screen tracks
            window.localStream.getTracks().forEach(track => track.stop());

            // 2. Switch back to the camera
            getUserMedia();
        }
    }

    let toggleChat = () => {
        setShowModal(!showModal);
    }

    let sendMessage = () => {
        // console.log("SentMessage");
        socketRef.current.emit("chat-message", message, username);
        // Also add it to our own UI immediately so we don't wait for the server
        addMessage(message, username, socketIdRef.current);
        setMessage("");
    }

    let routeTo = useNavigate();

    let endCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        } catch(e) {
            console.log(e)
        }
        window.location.href = "/";
    }

    return (

        // <div>Hello guys</div>

        <div className='fullScreen'>
            {askForUsername === true ?
                <div className='waitingContainer'>

                    <div className='waitingCard'>
                    <h2>Waiting Area</h2>
                    <p>Allow the camera and microphone settings to continue...</p>
                    <div>


                        {/* ================= LOCAL VIDEO ================= */}
                        <div>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: "600px",
                                    height: "300px",
                                    backgroundColor: "black",
                                    borderRadius: "8px",
                                    transform: "scaleX(-1)"
                                }}
                            />
                            {/* This prints your own unique socket ID */}
                            {/* <p style={{ color: "#aaa", fontSize: "0.8rem", marginTop: "5px" }}>
                            <strong>ID:</strong> {socketIdRef.current || "Assigning ID..."}
                        </p> */}
                        </div>
                        <div class='inputUsername'>
                            <h2>Enter username:</h2>
                            <input className='usernameField'
                                // id="filled-basic"
                                label="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                placeholder='username'
                            />
                            <button className='connectBtn' onClick={connect}>Connect</button>
                        </div>
                        {usernameError && (
                            <div className="errorBox">
                                Username cannot be empty. Please enter a valid username to continue.
                            </div>
                        )}
                    </div>
                </div>
                </div> :

                <div className='mainContainer'>
                    <div className='upperSection'>
                        <div className='videosList' styles={{ width: showModal ? "60rem" : "80rem" }}>
                            <div className='myVideoContainer'>
                                <video className='myVideo'
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline // Crucial for mobile devices. Without this, iPhones will force the video into full-screen mode or block it entirely.
                                />
                            </div>
                            {/* <h1>Participants: </h1> */}
                            <div className='otherCallersContainer'>
                                {/* <h1>{roomClientIds.length}</h1> */}
                                {roomClientIds.length >= 4 ? videos.map((v) => (
                                    <div key={v.socketId}>
                                        {/* <h2>4 or 5</h2> */}
                                        {/* <h2>{v.socketId}</h2> */}
                                        <video class="otherVideos-4or5"
                                            key={v.stream?.id ?? v.socketId} // This is a "Double-Key" safety measure. If a user’s video stream restarts or changes, this key forces React to treat the video tag as "new," which is sometimes necessary to refresh the visual feed.
                                            autoPlay
                                            playsInline
                                            ref={(ref) => {
                                                if (ref && v.stream) {
                                                    if (ref.srcObject !== v.stream) {
                                                        ref.srcObject = v.stream;
                                                        ref.play?.().catch(() => { });
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                )) : roomClientIds.length == 3 ? videos.map((v) => (
                                    <div key={v.socketId}>
                                        {/* <h2>3</h2> */}
                                        <video class="otherVideos-3"
                                            key={v.stream?.id ?? v.socketId}
                                            autoPlay
                                            playsInline
                                            ref={(ref) => {
                                                if (ref && v.stream) {
                                                    if (ref.srcObject !== v.stream) {
                                                        ref.srcObject = v.stream;
                                                        ref.play?.().catch(() => { });
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                )) : videos.map((v) => (
                                    <div key={v.socketId}>
                                        {/* <h2>2</h2> */}
                                        <video class="otherVideos-2"
                                            key={v.stream?.id ?? v.socketId}
                                            autoPlay
                                            playsInline
                                            ref={(ref) => {
                                                if (ref && v.stream) {
                                                    if (ref.srcObject !== v.stream) {
                                                        ref.srcObject = v.stream;
                                                        ref.play?.().catch(() => { });
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ))
                                }
                            </div>
                        </div>
                        {
                            showModal === true ?
                            <div className='chatSection'>
                                <div className='chatHeadingSection'>
                                    <h3 className='chatHeading'>Chat</h3>
                                    <h3 className='chatHeadingClose' onClick={toggleChat}>X</h3>
                                </div>
                            
                            <div className='chatsDisplay'>

                                {messages.length > 0 ? messages.map((item, index) => {
                                    return (
                                    <div key={index} className='chatMessage'>
                                        <p className='chatMessageUsername'>{item.sender}</p>
                                        <p className='chatMessageText'>{item.data}</p>
                                    </div>
                                    )
                                }) : <div style={{margin: "1rem"}}>No Messages Yet...</div>}
                            </div>
                            <div className='messageInput'>
                                <input value={message} onChange={e => setMessage(e.target.value)}
                                    type="text"
                                    placeholder='Enter message'
                                >

                                </input>
                                <button className='sendBtn' onClick={sendMessage}>Send</button>
                            </div>
                        </div> : null
                        }

                    </div>

                    <div className='callOptions'>
                        {
                            audio === true ?
                                <i class="fa-solid fa-microphone callButtons micBtn" onClick={toggleAudio}></i> :
                                <i class="fa-solid fa-microphone-slash callButtons micBtn" onClick={toggleAudio}></i>
                        }
                        {
                            video === true ?
                                <i class="fa-solid fa-video callButtons" onClick={toggleVideo}></i> : <i class="fa-solid fa-video-slash callButtons" onClick={toggleVideo}></i>
                        }
                        {
                            screenShare === true ?
                                <span class="material-symbols-outlined screenShareButton" onClick={toggleScreenShare}>screen_share
                                </span> :
                                <span class="material-symbols-outlined screenShareButton" onClick={toggleScreenShare}>screen_share
                                </span>
                        }
                        <i class="fa-solid fa-message callButtons chatBtn" onClick={toggleChat}></i>
                        <i class="fa-solid fa-phone endCallButton" onClick={endCall}></i>

                    </div>





















                    {/* <div
                        style={{
                            fontSize: "12px",
                            fontFamily: "monospace",
                            border: "1px solid #555",
                            padding: "10px",
                            marginBottom: "12px",
                            backgroundColor: "#1e1e1e",
                            color: "#d4d4d4",
                            borderRadius: "6px",
                            maxWidth: "720px",
                        }}
                    >
                        <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#fff" }}>Room / WebRTC debug</div>
                        <div><strong>My socket id:</strong> {mySocketId || "(waiting…)"}</div>
                        <div style={{ wordBreak: "break-all", marginTop: "4px" }}>
                            <strong>Room key (must match exactly on every tab):</strong> {typeof window !== "undefined" ? window.location.href : ""}
                        </div>
                        <div style={{ marginTop: "6px" }}>
                            <strong>Server list — total in room:</strong> {roomClientIds.length}
                            {roomClientIds.length > 0 ? (
                                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                                    {roomClientIds.map((sid) => (
                                        <li key={sid}>
                                            {sid}
                                            {sid === mySocketId ? " (you)" : ""}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span> (no one reported yet — check console for user-joined)</span>
                            )}
                        </div>
                        <div style={{ marginTop: "6px" }}>
                            <strong>Other participants (excl. you):</strong>{" "}
                            {roomClientIds.filter((sid) => sid !== mySocketId).length}
                        </div>
                        <div style={{ marginTop: "6px" }}>
                            <strong>Remote streams received (video tiles):</strong> {videos.length}
                        </div>
                        <div style={{ marginTop: "8px" }}>
                            <strong>PeerConnection state per remote id:</strong>
                            {Object.keys(peerDiagnostics).length === 0 ? (
                                <span> (no peer PCs yet)</span>
                            ) : (
                                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                                    {Object.entries(peerDiagnostics).map(([peerId, d]) => (
                                        <li key={peerId}>
                                            {peerId}: conn={d.connectionState}, ice={d.iceConnectionState}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div style={{ marginTop: "8px", color: "#888" }}>
                            Open DevTools → Console for [videoMeet] logs (signals, ontrack). If others &gt; 0 but ice stays
                            failed/disconnected, it is a WebRTC/network issue, not the participant list.
                        </div>
                    </div> */}


                </div>
            }
        </div>
    );
}
