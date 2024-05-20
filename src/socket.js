import io from "socket.io-client"

//const ENDPOINT = "https://noom-lms-server.onrender.com"
const ENDPOINT = "http://localhost:5000"

const socket = io(ENDPOINT)

export default socket
