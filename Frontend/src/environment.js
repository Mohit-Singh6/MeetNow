const server = {
    prod: import.meta.env.VITE_API_URL || (
        import.meta.env.DEV
            ? "http://localhost:3000"
            : "https://meetnowbackend-cu4q.onrender.com"
    )
};

export default server;