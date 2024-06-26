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

let meetingData = null

export default function Login({ socket_url }) {
  const [socket, setSocket] = useState(null)
  const [emailId, setEmailId] = useState("")
  const [passcode, setPassCode] = useState("")
  const [btnText, setBtnText] = useState("Sign In")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { room } = useParams()
  const [isDisabled, setIsDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [enterCode, setEnterCode] = useState(false)

  useEffect(() => {
    fetch(`https://noom-lms-server.onrender.com`)
      .then((response) => {
        console.log(response.status)
      })
      .catch((error) => {
        console.log(error)
      })

    const socket = io(socket_url)
    socket.on("connect", () => {
      setSocket(socket)
    })

    socket.on("occupied", (exists, msg) => {
      if (exists) {
        toast.warning(`${msg}`)
        setIsDisabled(false)
        setIsLoading(false)
      } else {
        const meeting = {
          instructor: meetingData.meeting.instructor,
          instructorId: meetingData.meeting.instructorId,
          room: meetingData.meeting.roomId,
          course: meetingData.meeting.courseName,
          desc: meetingData.meeting.description,
          date: meetingData.meeting.startDate,
          time: meetingData.meeting.startTime,
          duration: meetingData.meeting.duration,
        }

        const user = {
          username: meetingData.name,
          userId: meetingData.userId,
          email: emailId,
          img: meetingData.image,
        }

        setIsLoading(false)
        dispatch(setMeetingAndUser(meeting, user))
        dispatch(toggleLogin())
        navigate(`/lecture/${room}/live`)
        toast.success("You've joined the meeting")
      }
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
    //masac44960@undewp.com || lms470, lms851
    //macsonline500@gmail.com
    //arebine@gmail.com
    setIsLoading(true)
    setIsDisabled(true)

    if (btnText === "Sign In") {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailId.trim(),
        }),
      }
      fetch(`https://decode-mnjh.onrender.com/api/admin/otpForMeeting`, options)
        .then((response) => {
          setIsLoading(false)
          setEnterCode(true)
          setIsDisabled(false)
          setBtnText("Join Meeting")

          toast.success(
            "An email with a Passcode has been sent to your mailbox"
          )
        })
        .catch((error) => {
          console.log(error)
          setIsLoading(false)
          setIsDisabled(false)
          toast.error("Something went wrong, try again or contact the admin")
        })

      return
    }

    setIsDisabled(true)
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: passcode.trim(),
        email: emailId.trim(),
      }),
    }
    fetch(
      `https://decode-mnjh.onrender.com/api/admin/joinmeeting/${room}`,
      options
    )
      .then((response) => response.json())
      .then((data) => {
        //data.meeting.startDate = "2024-06-15"
        //data.meeting.startTime = "10:30:00"
        //data.meeting.duration = 7200
        //console.log(data)

        if (data.message) {
          toast.info(data.message)
          setIsLoading(false)
          setIsDisabled(false)
          return
        }

        meetingData = data
        if (socket === null) {
          toast.info("Network delay, retrying")
          setIsDisabled(false)
          return
        }

        socket.emit(
          "start",
          meetingData.userId,
          meetingData.meeting.instructorId,
          meetingData.meeting.startDate,
          meetingData.meeting.startTime
        )
      })
      .catch((error) => {
        console.log(error)
        toast.error(
          "Error: confirm passcode or check if you are registered for this course!"
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
              {enterCode && (
                <input
                  className="passcode-input"
                  type="text"
                  value={passcode}
                  placeholder="Enter Code"
                  autoComplete="off"
                  onChange={(e) => setPassCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              )}
              <button
                onClick={() => {
                  loadRoom()
                }}
                disabled={isDisabled}
              >
                {btnText}
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
