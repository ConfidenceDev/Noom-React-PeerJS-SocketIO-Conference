import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import "./room.css"
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsFillCameraVideoFill,
  BsFillCameraVideoOffFill,
  BsFillChatTextFill,
  BsFillRecordCircleFill,
  BsFillInfoCircleFill,
} from "react-icons/bs"
import { BiExpand, BiCollapse } from "react-icons/bi"
import { PiPresentationChartFill } from "react-icons/pi"
import { HiHandRaised } from "react-icons/hi2"
import { FaPeopleGroup } from "react-icons/fa6"
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"
import { GiBootKick } from "react-icons/gi"
import { IoExit } from "react-icons/io5"
import { GrSend } from "react-icons/gr"
import { AiOutlineClose } from "react-icons/ai"
import UserImg from "../../assets/user1.png"
import Peer from "peerjs"
import { v4 as uuidv4 } from "uuid"
import Modal from "../modal/modal"
import Kick from "../modal/kick"
import "../modal/modal.css"
import io from "socket.io-client"
import { toast } from "react-toastify"
import { useDispatch, useSelector } from "react-redux"
import { toggleLogin } from "../../store"
import "../animations.css"

const ENDPOINT = "https://noom-lms-server.onrender.com"
//const ENDPOINT = "http://localhost:5000"
let socket = null
let myId
let boardStream = null
let instructor = null
const calls = {}

export default function Room() {
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [muteAllEnabled, setMuteAllEnabled] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isParticipants, setIsParticipants] = useState(false)
  const [meetingDetails, setMeetingDetails] = useState(false)
  const [isBoard, setIsBoard] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isDisplay, setIsDisplay] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [kick, setKick] = useState(false)
  const { room } = useParams()
  const navigate = useNavigate()
  const [membersCount, setMembersCount] = useState("")
  const [members, setMembers] = useState([])
  const loggedIn = useSelector((state) => state.loggedIn)
  const meetingRecord = useSelector((state) => state.meeting)
  const userRecord = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isPhone, setIsPhone] = useState(false)
  const [myPeer, setMyPeer] = useState(null)
  const [peers, setPeers] = useState([])
  const videoGridRef = useRef()
  const presentationRef = useRef()
  const ulRef = useRef()

  let uniqueId = uuidv4()
  const nav =
    navigator.mediaDevices.getUserMedia ||
    navigator.mediaDevices.webkitGetUserMedia ||
    navigator.mediaDevices.mozGetUserMedia ||
    navigator.mediaDevices.msGetUserMedia
  const getUserMediaOptions = { video: true, audio: true }
  const getUserScreenOptions = { cursor: true, audio: true }

  const startBoard = () => {
    if (!socket) return

    if (instructor !== null) {
      toast.error("Someone is currently presenting!")
      return
    }

    setIsBoard(true)
    navigator.mediaDevices
      .getDisplayMedia(getUserScreenOptions)
      .then((stream) => {
        instructor = myId
        setIsDisplay(true)
        socket.emit("room-board-on", room, myId)
        boardStream = stream
        addBoardStream(stream)
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          boardStream = null
          instructor = null
          setIsDisplay(false)
          setIsBoard(false)
          setIsFullScreen(false)
          socket.emit("room-board-off", room, myId)
        })
      })
      .catch((error) => {
        toast.error("Error accessing media:", error)
        console.error("Error accessing media:", error)
      })
  }

  useEffect(() => {
    if (!loggedIn) return navigate(`/lecture/${room}`)

    socket = io(ENDPOINT)
    socket.on("connect", () => {
      myId = socket.id
      socket.emit("join-room", room, myId)

      //console.log(myId)
      //console.log(meetingRecord.instructorId, userRecord.userId)
      if (meetingRecord.instructorId === userRecord.userId) setIsAdmin(true)

      socket.on("nom", (data) => {
        setMembersCount(data.toString())
      })

      nav(getUserMediaOptions)
        .then((stream) => {
          initializePeer(stream)
          addVideoStream(myId, stream, "You")
        })
        .catch((error) => {
          toast.error("Error accessing media:", error)
          console.error("Error accessing media:", error)
        })

      const initializePeer = (localStream) => {
        const peer = new Peer(myId, {
          host: "noom-lms-server.onrender.com",
          port: 443,
          path: "/peerjs",
          secure: true,
        })
        loadPeerListeners(peer, localStream)
      }

      const loadPeerListeners = (peer, stream) => {
        peer.on("open", (id) => {
          //console.log("MY ID: " + id)
          setMyPeer(peer)
          socket.on("mute-all", (value) => {
            const videoElement = document.querySelector(`.${myId}`)
            if (videoElement) {
              const audioTrack = videoElement.srcObject.getAudioTracks()[0]
              if (audioTrack) audioTrack.enabled = value
              setAudioEnabled(value)
            }
          })

          socket.on("room-board-on", async (userID) => {
            instructor = userID
            const call = await peer.call(userID, stream)

            setIsBoard(true)
            setIsDisplay(true)
            setIsFullScreen(false)
            call.on("stream", (boardStream) => {
              addBoardStream(boardStream)
            })
          })

          socket.on("room-board-off", () => {
            instructor = null
            setIsFullScreen(false)
            removeBoardStream()
          })

          socket.on("user-connected", async (userID) => {
            console.log("Connecting to: " + userID)
            const call = await peer.call(userID, stream, {
              metadata: {
                username: userRecord.username,
                userId: userRecord.userId,
              },
            })

            let username = "LMS"
            let userId = ""
            socket.on("userRecord", (data) => {
              username = data.username
              userId = data.userId

              const doc = {
                userId: userId,
                username: username,
              }
              setMembers((members) => [...members, doc])
            })

            /*setPeers((prevConnections) => [
              ...prevConnections,
              { userID, call },
            ])*/
            calls[userID] = call
            call.on("stream", (userVideoStream) => {
              //console.log(calls)
              addVideoStream(userID, userVideoStream, username)
            })
          })

          socket.on("user-disconnected", (userID) => {
            //console.log(calls)
            if (calls[userID]) calls[userID].close()

            /*const disconnectedConnection = peers.find(
              (connection) => connection.userID === userID
            )
            
            console.log(disconnectedConnection)
            if (disconnectedConnection) {
              const { call } = disconnectedConnection
              call.close()
              setPeers((prevConnections) =>
                prevConnections.filter(
                  (connection) => connection.userID !== userID
                )
              )
            }*/
            //console.log(calls)
            removeVideoStream(userID)
          })

          socket.on("message", (msg) => {
            if (msg.userId === myId) msg.username = "You"
            //else msg.username = msg.username.substring(0, 6)
            setMessages((prevMessages) => [...prevMessages, msg])
            if (ulRef.current)
              ulRef.current.scrollTop = ulRef.current.scrollHeight
          })
        })

        peer.on("call", (call) => {
          if (
            call.metadata !== undefined &&
            userRecord.userId === call.metadata.userId
          ) {
            leave()
            toast.success("A User with this ID already exists!")
            return
          }
          const doc = {
            username: userRecord.username,
            userId: userRecord.userId,
          }
          socket.emit("userRecord", call.peer, doc)

          if (instructor === myId && boardStream) call.answer(boardStream)
          else call.answer(stream)

          call.on("stream", (userVideoStream) => {
            const existingVideoElement = document.getElementById(call.peer)
            if (!existingVideoElement) {
              const doc = {
                userId: call.metadata.userId,
                username: call.metadata.username,
              }
              setMembers((members) => [...members, doc])
              addVideoStream(call.peer, userVideoStream, call.metadata.username)
            }
          })
        })

        peer.on("disconnect", () => {
          peer.connections.forEach((conn) => {
            conn.close()
          })
          peer.destroy()
        })
      }
    })

    handleResize()
    window.addEventListener("resize", handleResize)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      socket.off("connect")
      socket.disconnect()
    }
  }, [])

  const handleBeforeUnload = () => {
    if (socket) {
      socket.off("connect")
      socket.disconnect()
    }
  }

  const handleResize = () => {
    setIsPhone(window.innerWidth < 1057)
  }

  const addBoardStream = (stream) => {
    if (presentationRef.current) presentationRef.current.srcObject = stream
  }

  const removeBoardStream = () => {
    setIsDisplay(false)
    setIsBoard(false)
    if (presentationRef.current) presentationRef.current.srcObject = null
  }

  const addVideoStream = (userID, stream, username) => {
    removeVideoStream(userID)
    const videoElement = document.createElement("video")
    videoElement.srcObject = stream
    videoElement.id = userID
    videoElement.className = userID
    videoElement.classList.add("video-stream")
    videoElement.setAttribute("autoplay", "")
    videoElement.setAttribute("playsinline", "")
    videoElement.addEventListener("loadedmetadata", () => {
      videoElement.play()
    })

    const label = document.createElement("label")
    label.textContent = `${username}`

    const videoContainer = document.createElement("div")
    videoContainer.id = userID
    videoContainer.className = "video-stream-container"
    videoContainer.appendChild(videoElement)
    videoContainer.appendChild(label)

    if (videoGridRef.current) videoGridRef.current.append(videoContainer)
  }

  const removeVideoStream = (userID) => {
    const existingVideoElement = document.getElementById(userID)
    if (existingVideoElement) {
      existingVideoElement.srcObject = null
      existingVideoElement.remove()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    const obj = {
      msg: message,
      username: userRecord.username,
      img: userRecord.img,
    }
    socket.emit("message", obj)
    setMessage("")
  }

  const toggleVideo = () => {
    const videoElement = document.querySelector(`.${myId}`)
    if (videoElement) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0]
      if (videoTrack) videoTrack.enabled = !videoEnabled
      setVideoEnabled(!videoEnabled)
    }
  }

  const toggleAudio = () => {
    const videoElement = document.querySelector(`.${myId}`)
    if (videoElement) {
      const audioTrack = videoElement.srcObject.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = !audioEnabled
      setAudioEnabled(!audioEnabled)
    }
  }

  const toggleRecord = () => {
    toast.success("Coming soon")
  }

  const toggleMuteAll = () => {
    socket.emit("mute-all", muteAllEnabled)
    setMuteAllEnabled(!muteAllEnabled)
  }

  const toggleKick = () => {
    setKick(!kick)
  }

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible)
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const toggleParticipants = () => {
    setIsParticipants(!isParticipants)
    setMeetingDetails(false)
  }

  const toggleMeetingDetails = () => {
    setMeetingDetails(!meetingDetails)
    setIsParticipants(false)
  }

  const leave = () => {
    const videoElement = document.querySelector(`.${myId}`)
    if (videoElement) {
      const tracks = videoElement.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
    }

    if (myPeer !== null) myPeer.destroy()
    if (socket) {
      socket.off("connect")
      socket.disconnect()
    }
    dispatch(toggleLogin())
    navigate(`/lecture/${room}`)
  }

  const leaveMeeting = () => {
    leave()
    toast.success("You left the meeting!")
  }

  return (
    <div className={`container`}>
      {meetingDetails && (
        <Modal
          meeting={meetingDetails}
          isParticipants={isParticipants}
          memCount={membersCount}
          roomDetails={meetingRecord.desc}
        />
      )}

      {isParticipants && (
        <Modal
          meeting={meetingDetails}
          isParticipants={isParticipants}
          memCount={membersCount}
          roomDetails={meetingRecord.desc}
        />
      )}

      {kick && <Kick kick={kick} members={members} />}

      <div className="stream-container">
        <div
          className={`stream-left ${
            isPhone ? (!isChatVisible ? "stream-show" : "stream-hide") : ""
          }`}
        >
          <div className="stream-grid-cover">
            {isBoard && (
              <div
                className={`presentation-container ${
                  isDisplay ? "show" : "hide"
                }`}
              >
                <video
                  ref={presentationRef}
                  className={`presentation`}
                  muted
                  autoPlay
                  playsInline
                ></video>
                {isFullScreen ? (
                  <BiCollapse
                    className="toggle-presentation"
                    onClick={toggleFullScreen}
                  />
                ) : (
                  <BiExpand
                    className="toggle-presentation"
                    onClick={toggleFullScreen}
                  />
                )}
              </div>
            )}
            <div
              ref={videoGridRef}
              className={`stream-grid ${
                isFullScreen ? "hide-board" : "show-board"
              }`}
            ></div>
          </div>
        </div>
        {isChatVisible && (
          <div className={`stream-right ${isPhone ? "stream-show" : ""}`}>
            <div className="stream-right-top">
              <div className="info">
                <label>Meeting Chat</label>
                <AiOutlineClose className="close-chat" onClick={toggleChat} />
              </div>
              <hr />
            </div>
            <ul ref={ulRef} className="stream-right-mid">
              {messages.map((obj, index) => (
                <li key={index}>
                  <div className="msg-container">
                    <div className="msg-top">
                      <label className="msg-name">{obj.username}</label>
                      <label className="msg-date">{obj.date}</label>
                    </div>
                    <div className="msg-bottom">
                      <img
                        loading="lazy"
                        src={obj.img.length > 0 ? obj.img[0].path : UserImg}
                        alt="User"
                      />
                      <p className="msg">{obj.msg}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="stream-right-bottom">
              <div className="btm-col">
                <div className="btm-col-top">
                  <label>Who can see your messages?</label>
                  <label className="lb-see">Everyone</label>
                </div>
                <div className="btm-row">
                  <input
                    type="text"
                    placeholder="Write..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <GrSend className="btm-send" onClick={handleSendMessage} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bottom-nav">
        <div className="bottom-container">
          <div className="nav-btn" onClick={toggleVideo}>
            {videoEnabled ? (
              <BsFillCameraVideoOffFill className="nav-icon" />
            ) : (
              <BsFillCameraVideoFill className="nav-icon" />
            )}
            <label>{videoEnabled ? "Hide Video" : "Show Video"}</label>
          </div>
          <div className="nav-btn" onClick={toggleAudio}>
            {audioEnabled ? (
              <BsFillMicMuteFill className="nav-icon" />
            ) : (
              <BsFillMicFill className="nav-icon" />
            )}
            <label> {audioEnabled ? "Mute" : "Unmute"}</label>
          </div>
          <div className="nav-btn" onClick={toggleChat}>
            <BsFillChatTextFill className="nav-icon" />
            <label> {isChatVisible ? "Hide Chat" : "Show Chat"}</label>
          </div>
          <div className="nav-btn">
            <PiPresentationChartFill
              className="nav-icon"
              onClick={startBoard}
            />
            <label>Presentation</label>
          </div>
          {/* ========== Admin function =============*/}
          {isAdmin && (
            <div className="nav-btn" onClick={toggleRecord}>
              <BsFillRecordCircleFill className="nav-icon" />
              <label>Record</label>
            </div>
          )}
          {isAdmin && (
            <div className="nav-btn" onClick={toggleMuteAll}>
              {muteAllEnabled ? (
                <FaVolumeUp className="nav-icon" />
              ) : (
                <FaVolumeMute className="nav-icon" />
              )}
              <label> {muteAllEnabled ? "UnMute All" : "Mute All"}</label>
            </div>
          )}
          {isAdmin && (
            <div className="nav-btn" onClick={toggleKick}>
              <GiBootKick className="nav-icon" />
              <label>Kick</label>
            </div>
          )}
          {/* ========== Admin function =============*/}
          <div className="nav-btn">
            <HiHandRaised className="nav-icon" />
            <label>Raise Hand</label>
          </div>
          <div className="nav-btn" onClick={toggleParticipants}>
            <div className="mem-cover">
              <label className="mem-count">{membersCount}</label>
              <FaPeopleGroup className="mem-icon" />
            </div>
            <label>Participants</label>
          </div>
          <div
            className="meeting-details nav-btn"
            onClick={toggleMeetingDetails}
          >
            <BsFillInfoCircleFill className="nav-icon" />
            <label>Meeting Details</label>
          </div>
          <div className="leave-meeting nav-btn" onClick={leaveMeeting}>
            <IoExit className="nav-leave-icon" />
            <label>Leave Meeting</label>
          </div>
        </div>
      </div>
    </div>
  )
}
