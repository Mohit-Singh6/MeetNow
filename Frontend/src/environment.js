let IS_PROD = true;
const server = IS_PROD ? {
    prod: "https://meetnowbackend-cu4q.onrender.com"
} : {
    prod: "http://localhost:3000"
}

export default server;