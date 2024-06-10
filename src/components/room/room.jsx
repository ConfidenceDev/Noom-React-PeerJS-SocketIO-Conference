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
import { LuAlarmCheck } from "react-icons/lu"
import { PiPresentationChartFill } from "react-icons/pi"
import { HiHandRaised } from "react-icons/hi2"
import { FaPeopleGroup } from "react-icons/fa6"
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"
import { GiBootKick } from "react-icons/gi"
import { IoExit } from "react-icons/io5"
import { GrSend } from "react-icons/gr"
import { AiOutlineClose } from "react-icons/ai"
import UserImg from "../../assets/user1.png"
import MuteImg from "../../assets/mute.png"
import Peer from "peerjs"
import { v4 as uuidv4 } from "uuid"
import Modal from "../modal/modal"
import Kick from "../modal/kick"
import Timer from "../modal/timer"
import "../modal/modal.css"
import { toast } from "react-toastify"
import { useDispatch, useSelector } from "react-redux"
import { toggleLogin } from "../../store"
import "../animations.css"
import io from "socket.io-client"

let socket = null
let myId = null
let prevId = null
let boardStream = null
let instructor = null
let members = []
const calls = {}
let chatAlert = false
let uniqueId = uuidv4()

export default function Room({ socket_url }) {
  const loggedIn = useSelector((state) => state.loggedIn)
  const meetingRecord = useSelector((state) => state.meeting)
  const userRecord = useSelector((state) => state.user)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [muteAllEnabled, setMuteAllEnabled] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(
    window.innerWidth > 1057 ? true : false
  )
  //const [chatAlert, setChatAlert] = useState(false)
  const [meetingDetails, setMeetingDetails] = useState(false)
  const [timerDialog, setTimerDialog] = useState(false)
  const [isBoard, setIsBoard] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isDisplay, setIsDisplay] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [kick, setKick] = useState(false)
  const [isParticipants, setIsParticaipants] = useState(false)
  const { room } = useParams()
  const navigate = useNavigate()
  const [membersCount, setMembersCount] = useState("")
  const dispatch = useDispatch()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isPhone, setIsPhone] = useState(false)
  const [myPeer, setMyPeer] = useState(null)
  const [duration, setDuration] = useState(0)
  const videoGridRef = useRef()
  const presentationRef = useRef()
  const ulRef = useRef()

  const startBoard = () => {
    if (!socket) return

    if (instructor !== null) {
      toast.error("Someone is currently presenting!")
      return
    }

    setIsBoard(true)
    navigator.mediaDevices
      .getDisplayMedia({ cursor: true, audio: true })
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
    handleResize()

    /*const recordId = userRecord.userId
    socket = io(ENDPOINT, {
      query: {
        recordId,
      },
    })*/
    socket = io(socket_url)
    socket.on("connect", () => {
      if (myId !== null && myId !== prevId) prevId = myId
      myId = socket.id

      const duration = meetingRecord.duration ? meetingRecord.duration : 7200 //7200=2hrs
      socket.emit("join-room", room, userRecord.userId, duration)

      if (meetingRecord.instructorId === userRecord.userId) setIsAdmin(true)

      socket.on("nom", (data) => {
        setMembersCount(data.toString())
      })

      const loadStream = async () => {
        try {
          const mediaOptions = {
            video: true,
            audio: true,
          }
          const stream =
            (await navigator.mediaDevices.getUserMedia(mediaOptions)) ||
            (await navigator.mediaDevices.webkitGetUserMedia(mediaOptions)) ||
            (await navigator.mediaDevices.mozGetUserMedia(mediaOptions)) ||
            (await navigator.mediaDevices.msGetUserMedia(mediaOptions))

          initializePeer(stream)
          addVideoStream(myId, stream, "You", userRecord.img)
        } catch (error) {
          toast.error("Error accessing media:", error)
          console.error("Error accessing media:", error)
        }
      }

      loadStream()
      const initializePeer = (localStream) => {
        /*const peer = new Peer(myId, {
          host: "localhost",
          port: 5000,
          path: "/peerjs",
        })*/
        const peer = new Peer(myId, {
          host: "noom-lms-server.onrender.com",
          port: 443,
          path: "/peerjs",
          secure: true,
          config: {
            iceServers: [
              {
                urls: "stun:stun.relay.metered.ca:80",
              },
              {
                urls: "turn:a.relay.metered.ca:80",
                username: "7f3ab71881d9c115a4fc0189",
                credential: "750xbgrmZbW0DRxo",
              },
              {
                urls: "turn:a.relay.metered.ca:80?transport=tcp",
                username: "7f3ab71881d9c115a4fc0189",
                credential: "750xbgrmZbW0DRxo",
              },
              {
                urls: "turn:a.relay.metered.ca:443",
                username: "7f3ab71881d9c115a4fc0189",
                credential: "750xbgrmZbW0DRxo",
              },
              {
                urls: "turn:a.relay.metered.ca:443?transport=tcp",
                username: "7f3ab71881d9c115a4fc0189",
                credential: "750xbgrmZbW0DRxo",
              },
            ],
          },
        })
        loadPeerListeners(peer, localStream)
      }

      const loadPeerListeners = (peer, stream) => {
        peer.on("open", (id) => {
          setMyPeer(peer)
          socket.on("mute-all", (value) => {
            const videoElement = document.querySelector(`.${myId}`)
            updateMuteIcon(myId, value)
            const doc = {
              userId: myId,
              audioEnabled: value,
            }
            socket.emit("mute-me", doc)

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

          socket.on("mute-me", (data) => {
            updateMuteIcon(data.userId, data.audioEnabled)
          })

          const updateMuteIcon = (userId, audioEnabled) => {
            const videoContainer = document.getElementById(`${userId}`)
            if (!videoContainer) return
            const muteIcon = videoContainer.querySelector(".video-mute-icon")
            if (!muteIcon) return

            audioEnabled = !audioEnabled
            if (audioEnabled) {
              muteIcon.classList.remove("hide")
              muteIcon.classList.add("show")
            } else {
              muteIcon.classList.remove("show")
              muteIcon.classList.add("hide")
            }
          }

          socket.on("hide-me", (data) => {
            updateHideImg(data.userId, data.videoEnabled)
          })

          const updateHideImg = (userId, videoEnabled) => {
            const videoContainer = document.getElementById(`${userId}`)
            if (!videoContainer) return
            const videoElement = videoContainer.querySelector("video")
            if (!videoElement) return

            const hideVid = videoContainer.querySelector(".video-hide-img")
            if (!hideVid) return

            videoEnabled = !videoEnabled
            if (videoEnabled) {
              hideVid.classList.remove("hide")
              hideVid.classList.add("show")
              videoElement.classList.add("hide")
              videoElement.classList.remove("show")
            } else {
              hideVid.classList.remove("show")
              hideVid.classList.add("hide")
              videoElement.classList.add("show")
              videoElement.classList.remove("hide")
            }
          }

          socket.on("user-connected", async (userID) => {
            console.log("Connecting to: " + userID)
            const call = await peer.call(userID, stream, {
              metadata: {
                username: userRecord.username,
                userId: myId,
                img: userRecord.img,
              },
            })

            let username = "LMS"
            let userId = ""
            let img = []
            socket.on("user-record", (data) => {
              username = data.username
              userId = data.userId
              img = data.img

              const doc = {
                userId: userId,
                username: username,
                img: img,
              }
              members = [...members, doc]
              toast.success(`${username} joined the meeting`)
            })
            calls[userID] = call
            call.on("stream", (userVideoStream) => {
              addVideoStream(userID, userVideoStream, username, img)
            })
          })

          socket.on("user-disconnected", (userID) => {
            if (calls[userID]) calls[userID].close()
            const member = members.find((member) => member.userId === userID)
            if (member) toast.error(`${member.username} left the meeting`)
            updateMembers(userID)
            removeVideoStream(userID)
          })

          socket.on("kick", (userId) => {
            if (userId === myId) {
              leave()
              toast.info("You've been removed by the instructor")
            } else {
              const member = members.find((member) => member.userId === userId)
              if (member) toast.error(`${member.username} has been removed`)
              updateMembers(userId)
            }
          })

          socket.on("message", (msg) => {
            if (msg.userId === myId) msg.username = "You"
            setMessages((prevMessages) => [...prevMessages, msg])
            if (msg.userId !== myId && chatAlert) {
              const content = `${msg.username}: ${
                msg.msg.length > 10 ? `${msg.msg.substring(0, 10)}...` : msg.msg
              }`
              toast.success(content)
            }
            if (ulRef.current)
              ulRef.current.scrollTop = ulRef.current.scrollHeight
          })
        })

        peer.on("call", (call) => {
          /*if (call.metadata !== undefined && myId === call.metadata.userId) {
          leave()
          toast.error("A User with this ID already exists")
          return
        }*/
          const doc = {
            username: userRecord.username,
            userId: myId,
            img: userRecord.img,
          }
          socket.emit("user-record", call.peer, doc)

          if (instructor === myId && boardStream) call.answer(boardStream)
          else call.answer(stream)

          call.on("stream", (userVideoStream) => {
            const existingVideoElement = document.getElementById(call.peer)
            if (!existingVideoElement) {
              const doc = {
                userId: call.metadata.userId,
                username: call.metadata.username,
                img: call.metadata.img,
              }
              members = [...members, doc]
              addVideoStream(
                call.peer,
                userVideoStream,
                call.metadata.username,
                call.metadata.img
              )

              if (instructor === null) socket.emit("check-presentation")
            }
          })
        })

        socket.on("timer", (data) => {
          if (data === -1) {
            leave()
            toast.success("Time Elapsed!")
          } else if (data === 600) {
            toast.info("10 mins remaining for this class!")
          } else setDuration(data)
        })

        peer.on("disconnect", () => {
          peer.connections.forEach((conn) => {
            conn.close()
          })
          peer.destroy()
        })
      }
    })

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
    exitCleanUp()
  }

  const handleResize = () => {
    if (window.innerWidth < 1057) chatAlert = true
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

  const addVideoStream = (userID, stream, username, img) => {
    removeVideoStream(userID)
    const videoElement = document.createElement("video")
    videoElement.srcObject = stream
    videoElement.id = userID
    videoElement.className = userID
    if (userID === myId) videoElement.muted = true
    videoElement.classList.add("video-stream")
    videoElement.setAttribute("autoplay", "")
    videoElement.setAttribute("playsinline", "")
    videoElement.addEventListener("loadedmetadata", () => {
      videoElement.play()
    })

    const imgHideVid = document.createElement("img")
    imgHideVid.className = "video-hide-img"
    imgHideVid.setAttribute("src", img.length > 0 ? img[0].path : UserImg)

    const muteIcon = document.createElement("img")
    muteIcon.setAttribute("src", MuteImg)
    muteIcon.className = "video-mute-icon hide"

    const label = document.createElement("label")
    label.textContent = `${username}`

    const videoContainer = document.createElement("div")
    videoContainer.id = userID
    videoContainer.className = "video-stream-container"
    videoContainer.appendChild(videoElement)
    videoContainer.appendChild(label)
    videoContainer.appendChild(muteIcon)
    videoContainer.appendChild(imgHideVid)

    if (videoGridRef.current) videoGridRef.current.append(videoContainer)
  }

  const removeVideoStream = (userID) => {
    if (userID === myId && prevId !== null) removeVideoStreamEl(prevId)
    removeVideoStreamEl(userID)
  }

  const removeVideoStreamEl = (userID) => {
    const videoContainer = document.getElementById(`${userID}`)
    if (!videoContainer) return
    const videoElement = videoContainer.querySelector("video")
    if (!videoElement) return

    videoElement.srcObject = null
    videoContainer.remove()
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if (message === "" || message === null) return

    const obj = {
      msg: message,
      username: userRecord.username,
      img: userRecord.img,
    }
    socket.emit("message", obj)
    setMessage("")
  }

  const toggleVideo = () => {
    const videoContainer = document.getElementById(`${myId}`)
    if (!videoContainer) return
    const videoElement = videoContainer.querySelector("video")
    if (!videoElement) return

    const hideVid = videoContainer.querySelector(".video-hide-img")
    if (!hideVid) return
    if (videoEnabled) {
      hideVid.classList.remove("hide")
      hideVid.classList.add("show")
      videoElement.classList.add("hide")
      videoElement.classList.remove("show")
    } else {
      hideVid.classList.remove("show")
      hideVid.classList.add("hide")
      videoElement.classList.add("show")
      videoElement.classList.remove("hide")
    }

    const doc = {
      userId: myId,
      videoEnabled: !videoEnabled,
    }
    socket.emit("hide-me", doc)
    const videoTrack = videoElement.srcObject.getVideoTracks()[0]
    if (videoTrack) videoTrack.enabled = !videoEnabled
    setVideoEnabled(!videoEnabled)
  }

  const toggleAudio = () => {
    const videoContainer = document.getElementById(`${myId}`)
    if (!videoContainer) return
    const videoElement = videoContainer.querySelector("video")

    const muteIcon = videoContainer.querySelector(".video-mute-icon")
    if (!muteIcon) return
    if (audioEnabled) {
      muteIcon.classList.remove("hide")
      muteIcon.classList.add("show")
    } else {
      muteIcon.classList.remove("show")
      muteIcon.classList.add("hide")
    }

    const doc = {
      userId: myId,
      audioEnabled: !audioEnabled,
    }
    socket.emit("mute-me", doc)
    if (videoElement) {
      const audioTrack = videoElement.srcObject.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = !audioEnabled
      setAudioEnabled(!audioEnabled)
    }
  }

  const removeMember = (userId) => {
    socket.emit("kick", userId)
    updateMembers(userId)
  }

  const updateMembers = (userId) => {
    /*setMembers((members) =>
      members.filter((member) => member.userId !== userId)
    )*/
    members = members.filter((member) => member.userId !== userId)
  }

  const toggleRecord = () => {
    toast.info("Coming soon")
  }

  const toggleMuteAll = () => {
    socket.emit("mute-all", muteAllEnabled)
    setMuteAllEnabled(!muteAllEnabled)
  }

  const toggleKick = () => {
    setKick(!kick)
  }

  const toggleChat = () => {
    chatAlert = !chatAlert
    //setChatAlert(!chatAlert)
    setIsChatVisible(!isChatVisible)
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const toggleParticipants = () => {
    setIsParticaipants(!isParticipants)
    setMeetingDetails(false)
    setTimerDialog(false)
  }

  const toggleMeetingDetails = () => {
    setMeetingDetails(!meetingDetails)
    setIsParticaipants(false)
    setTimerDialog(false)
  }

  const toggleTimer = () => {
    setTimerDialog(!timerDialog)
    setIsParticaipants(false)
    setMeetingDetails(false)
  }

  const exitCleanUp = () => {
    try {
      const videoContainer = document.getElementById(`${myId}`)
      const videoElement = videoContainer.querySelector("video")

      if (videoElement) {
        const tracks = videoElement.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
      }

      instructor = null
      if (myPeer !== null) myPeer.destroy()

      if (socket) {
        socket.off("connect")
        socket.disconnect()
      }
    } catch (e) {
      console.log(e)
    }
  }

  const leave = () => {
    exitCleanUp()
    dispatch(toggleLogin())
    navigate(`/lecture/${room}`)
  }

  const leaveMeeting = () => {
    leave()
    toast.success("You left the meeting")
  }

  return (
    <div className={`room-container`}>
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

      {kick && (
        <Kick
          kick={kick}
          socket={socket}
          members={members}
          kicked={(userId) => removeMember(userId)}
        />
      )}

      {timerDialog && <Timer timerDialog={timerDialog} duration={duration} />}

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
                      <label className="msg-date">{`${obj.date} WAT`}</label>
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
          <div className="nav-btn" onClick={toggleTimer}>
            <LuAlarmCheck className="nav-icon timer" />
            <label>Timer</label>
          </div>

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
          {!isPhone && (
            <div className="nav-btn">
              <PiPresentationChartFill
                className="nav-icon"
                onClick={startBoard}
              />
              <label>Presentation</label>
            </div>
          )}
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
          {/* <div className="nav-btn">
            <HiHandRaised className="nav-icon" />
            <label>Raise Hand</label>
          </div> */}
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
