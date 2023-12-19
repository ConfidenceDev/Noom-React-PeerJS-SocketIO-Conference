import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import StudentImg from "../../assets/student.png"
import Logo from "../../assets/video.png"
import "./login.css"
import "../animations.css"
import { useDispatch } from "react-redux"
import { toggleLogin, setMeetingAndUser } from "../../store"

export default function Login() {
  const [emailId, setEmailId] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { room } = useParams()
  const [isDisabled, setIsDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch(`https://noom-lms-server.onrender.com`)
      //fetch(`http://localhost:5000`)
      .then((response) => {
        console.log(response.status)
      })
      .catch((error) => {
        console.log(error)
      })
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
    //ebisedi@yahoo.com || lms198
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
      `https://server-eight-beige.vercel.app/api/admin/joinmeeting/${room}`,
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

        setIsLoading(false)
        setIsDisabled(false)
        dispatch(setMeetingAndUser(meeting, user))
        dispatch(toggleLogin())
        setIsDisabled(false)
        toast.success("You've joined the meeting")
        navigate(`/lecture/${room}/live`)
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
      <div className={`container`}>
        <div className="nav">
          <div className="logo">
            <img src={Logo} alt="logo" />
            <label htmlFor="logo">Decode LMS</label>
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
        <label htmlFor="copyright" className="copyright">
          LMS, Copyright &#169; 2023 Decode Team
        </label>
      </div>
    </>
  )
}
