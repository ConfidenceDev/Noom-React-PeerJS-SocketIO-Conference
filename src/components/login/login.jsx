import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import StudentImg from "../../assets/student.png"
import Logo from "../../assets/video.png"
import "./login.css"
import "../animations.css"
import { useDispatch, useSelector } from "react-redux"
import { toggleLogin, setMeetingAndUser } from "../../store"

export default function Login() {
  const [emailId, setEmailId] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loggedIn = useSelector((state) => state.value)
  const { room } = useParams()
  const [isDisabled, setIsDisabled] = useState(false)

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
      return toast.error("Please enter your student id!")

    //spacemars666@gmail.com
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

        setIsDisabled(false)
        dispatch(setMeetingAndUser(meeting, user))
        dispatch(toggleLogin())
        setIsDisabled(false)
        toast.success("You've joined the meeting")
        navigate(`/lecture/${room}/live`)
      })
      .catch((error) => {
        console.log(error)
        toast.error(error.message)
        setIsDisabled(false)
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
