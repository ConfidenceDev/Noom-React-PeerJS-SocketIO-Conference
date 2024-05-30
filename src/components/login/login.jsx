import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import StudentImg from "../../assets/student.png"
import Logo from "../../assets/video.png"
import "./login.css"
import "../animations.css"
import { useDispatch } from "react-redux"
import { toggleLogin, setMeetingAndUser } from "../../store"
import io from "socket.io-client"

export default function Login({ socket_url }) {
  const [socket, setSocket] = useState(null)
  const [emailId, setEmailId] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { room } = useParams()
  const [isDisabled, setIsDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const socket = io(socket_url)
    socket.on("connect", () => {
      setSocket(socket)
    })

    //fetch("https://peerserver-two.vercel.app")
    fetch(`https://noom-lms-server.onrender.com`)
      //fetch(`http://localhost:5000`)
      .then((response) => {
        console.log(response.status)
      })
      .catch((error) => {
        console.log(error)
      })

    return () => {
      socket.off("connect")
      socket.disconnect()
    }
  }, [])

  const loadRoom = () => {
    loadUser()
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      loadUser()
    }
  }

  function loadUser() {
    if (emailId === null || emailId === "")
      return toast.error("Please enter your email id!")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailId)) return toast.error("Enter a valid email!")

    //spacemars666@gmail.com
    //decodeanalytical@gmail.com
    //ebisedi@yahoo.com || lms983
    //masac44960@undewp.com || lms470
    //macsonline500@gmail.com
    setIsLoading(true)
    setIsDisabled(true)
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailId.trim(),
      }),
    }
    fetch(
      //`https://server-eight-beige.vercel.app/api/admin/joinmeeting/${room}`,
      `https://decode-mnjh.onrender.com/api/admin/joinmeeting/${room}`,
      options
    )
      .then((response) => response.json())
      .then((data) => {
        //console.log(data)
        const meeting = {
          instructor: data.meeting.instructor,
          instructorId: data.meeting.instructorId,
          room: data.meeting.roomId,
          course: data.meeting.courseName,
          desc: data.meeting.description,
          date: data.meeting.date,
          time: data.meeting.time,
        }

        const user = {
          username: data.name,
          userId: data.userId,
          email: emailId,
          img: data.image,
        }

        if (socket === null) {
          toast.loading("Network delay, retrying")
          return
        }

        socket.emit("start", data.userId, data.meeting.instructorId)
        socket.on("occupied", (exists, msg) => {
          if (exists) {
            toast.warning(`${msg}`)
            setIsDisabled(false)
            setIsLoading(false)
            return
          }

          setIsLoading(false)
          setIsDisabled(false)
          dispatch(setMeetingAndUser(meeting, user))
          dispatch(toggleLogin())
          setIsDisabled(false)
          toast.success("You've joined the meeting")
          navigate(`/lecture/${room}/live`)
        })
      })
      .catch((error) => {
        console.log(error)
        toast.error(
          "Something went wrong: check if you are registered for this course!"
        )
        setIsDisabled(false)
        setIsLoading(false)
      })
  }

  return (
    <>
      <div className={`login-container`}>
        <div className="nav">
          <div className="logo">
            <img src={Logo} alt="logo" />
            <label>Decode LMS</label>
          </div>
        </div>
        <div className="entry">
          <img src={StudentImg} alt="student" />
          <div className="login">
            <div className="inputs">
              <input
                type="text"
                value={emailId}
                placeholder="Email ID"
                autoComplete="on"
                onChange={(e) => setEmailId(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={() => {
                  loadRoom()
                }}
                disabled={isDisabled}
              >
                Join Meeting
              </button>
              <div
                className={`loading-spinner ${isLoading ? "show" : "hide"}`}
              ></div>
            </div>
            <hr />
          </div>
        </div>
        <div className="copyright">
          <label>LMS, Copyright &#169; 2024 Decode Team</label>
        </div>
      </div>
    </>
  )
}
