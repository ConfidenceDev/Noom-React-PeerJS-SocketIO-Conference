import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import StudentImg from "../../assets/student.png"
import Logo from "../../assets/video.png"
import "./login.css"
import "../animations.css"
import { useDispatch, useSelector } from "react-redux"
import { toggleLogin, setMeetingAndUser } from "../../store"
import axios from "axios"

export default function Login() {
  const [emailId, setEmailId] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loggedIn = useSelector((state) => state.value)
  const { room } = useParams()
  const [meetingExist, setMeetingExist] = useState(false)
  const [meetingDetails, setMeetingDetails] = useState({})
  const [registered, setRegistered] = useState(true)

  useEffect(() => {
    /*const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "spacemars666@gmail.com",
      }),
    }
    axios
      .get(
        `https://decode-mnjh.onrender.com/api/admin/studentJoinMeeting/${room}`,
        options
      )
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
        console.log(error)
        toast.error("Something went wrong, try again")
      })*/
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
      return toast.error("Please enter your student id!")

    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "spacemars666@gmail.com",
      }),
    }
    /*fetch(
      `https://decode-mnjh.onrender.com/api/admin/studentJoinMeeting/${room}`,
      options
    )*/
    fetch(`https://jsonplaceholder.typicode.com/users/1`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data)

        const meeting = {
          instructor: "Joe",
          instructorId: "2",
          room: "mluksn",
          course: "Geography",
          desc: "Continents around the world",
          date: "25-10-2023",
          time: "08:45 am",
        }

        const user = {
          username: "Dev",
          userId: "2",
          email: "dev@gmail.com",
          img: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?cs=srgb&dl=pexels-pixabay-220453.jpg&fm=jpg",
        }

        //Check if the user has course registered
        if (registered) {
          dispatch(setMeetingAndUser(meeting, user))
          dispatch(toggleLogin())
          toast.success("You've joined the meeting")
          navigate(`/lecture/${room}/live`)
        } else {
          toast.error("You've not registered for this course")
        }

        /*if (!meetingExist) {
          toast.error("Oops, no scheduled meeting with that name!")
          return
        }*/
      })
      .catch((error) => {
        console.log(error)
        toast.error("Something went wrong, try again")
      })
  }

  return (
    <>
      <div className={`container`}>
        <div className="nav">
          <div className="logo">
            <img src={Logo} alt="logo" />
            <label htmlFor="logo">LMS Noom</label>
          </div>
          {meetingExist && (
            <div className="meeting-card">
              <label>
                <span>Instructor: </span>
                {meeting.instructor}
              </label>
              <label>
                <span>Course: </span>
                {meeting.course}
              </label>
              <label>
                <span>Meeting Date: </span>
                {meeting.date}
              </label>
              <label>
                <span>Meeting Time: </span>
                {meeting.time}
              </label>
            </div>
          )}
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
              >
                Join Meeting
              </button>
            </div>
            <hr />
          </div>
        </div>
        <label htmlFor="copyright" className="copyright">
          LMS, Copyright &#169; 2023 DecodeAnalytics Team
        </label>
      </div>
    </>
  )
}
