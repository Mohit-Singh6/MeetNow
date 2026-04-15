The `src/context` folder is used to store **React Context API** files. Its primary purpose is to solve **"Prop Drilling"**—the annoying process of passing data through multiple components that don't actually need it, just to get it to a child component that does.

Think of Context as a **Global Radio Station** for your app. Instead of passing a physical letter from person to person (Props), you broadcast a signal, and anyone with a "radio" (Consumer) can tune in and hear the data.

---

### Why use a `context` folder?

* **Centralization:** It keeps all your "Global States" (like User Info, Themes, or Shopping Carts) in one organized place.
* **Clean Code:** It prevents your `App.jsx` from becoming a massive wall of state variables.
* **Accessibility:** Any component in your app can "reach out" and grab the data it needs instantly.

---

### Common Examples

| Context Name | Use Case | Example Data |
| :--- | :--- | :--- |
| **AuthContext** | Managing User Login | `user: { name: "Mohit", id: 123 }`, `isAuthenticated: true` |
| **ThemeContext** | Dark/Light Mode | `theme: "dark"`, `toggleTheme: () => {}` |
| **CartContext** | E-commerce Apps | `items: []`, `totalPrice: 0`, `addToCart()` |
| **SocketContext** | Real-time Apps | `socket: io_instance`, `isConnected: true` |

---

### A Simple "Theme" Example

Instead of passing the "dark" string through Header → Nav → Button, you create a context:

1.  **Define (`ThemeContext.js`):**
    ```javascript
    export const ThemeContext = createContext("light");
    ```
2.  **Provide (`App.jsx`):**
    ```jsx
    <ThemeContext.Provider value="dark">
       <Dashboard /> 
    </ThemeContext.Provider>
    ```
3.  **Consume (`Button.jsx`):**
    ```javascript
    const theme = useContext(ThemeContext); // Returns "dark" automatically!
    ```



---

### How this applies to your Video Call project
In your project, you could create a **`SocketContext.js`**. This would allow you to initialize the socket connection **once** and then use that same `socket` instance in your `LandingPage.jsx`, `VideoMeet.jsx`, and even a `Chat.jsx` without having to re-connect or pass refs everywhere.
