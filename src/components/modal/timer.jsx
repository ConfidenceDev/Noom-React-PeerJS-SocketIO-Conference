import { useState } from "react"
import "./modal.css"
import { AiOutlineClose } from "react-icons/ai"

export default function Timer({ timerDialog }) {
  const [showTimer, setShowTimer] = useState(timerDialog)

  const toggleTimer = () => {
    setShowTimer(!showTimer)
  }

  return (
    <>
      {showTimer && (
        <div className="modal">
          <div onClick={toggleTimer} className="overlay"></div>
          <div className="modal-content">
            <div className="modal-top">
              <label className="modal-header">Time Remaining</label>
              <AiOutlineClose className="close-btn" onClick={toggleTimer} />
            </div>
            <div>1hr 30mins left for this meeting</div>
          </div>
        </div>
      )}
    </>
  )
}
