import { useEffect, useState } from "react"
import "./modal.css"
import { AiOutlineClose } from "react-icons/ai"
import { toast } from "react-toastify"

export default function Kick({ kick, members }) {
  const [showKick, setShowKick] = useState(kick)

  useEffect(() => {
    console.log(members)
  }, [])

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
              <li>
                <div className="kick-item-user">
                  <label className="kick-name">John Doe</label>
                  <input className="kick-btn" type="button" value="Kick" />
                </div>
                <hr />
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
