import { useState } from "react"
import "./modal.css"
import { AiOutlineClose } from "react-icons/ai"

export default function Kick({ kick, members, kicked }) {
  const [showKick, setShowKick] = useState(kick)
  const uniqueMembers = []
  const seenUsernames = new Set()

  members.forEach((member) => {
    if (!seenUsernames.has(member.username)) {
      seenUsernames.add(member.username)
      uniqueMembers.push(member)
    }
  })

  const kickMember = (obj) => {
    kicked(obj.userId)
  }

  const toggleKick = () => {
    setShowKick(!showKick)
  }

  return (
    <>
      {showKick && (
        <div className="modal">
          <div onClick={toggleKick} className="overlay"></div>
          <div className="modal-content">
            <div className="modal-top">
              <label className="modal-header">Kick</label>
              <AiOutlineClose className="close-btn" onClick={toggleKick} />
            </div>
            <ul className="kick-members">
              {uniqueMembers.length < 1 && (
                <label className="no-members">No members</label>
              )}
              {uniqueMembers.map((obj, index) => (
                <li key={obj.userId}>
                  <div className="kick-item-user">
                    <label className="kick-name">{obj.username}</label>
                    <input
                      className="kick-btn"
                      type="button"
                      value="Kick"
                      onClick={() => kickMember(obj)}
                    />
                  </div>
                  <hr />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
