import { useEffect, useState } from "react"
import "./modal.css"
import { AiOutlineClose } from "react-icons/ai"

export default function Timer({ timerDialog, duration }) {
  const [showTimer, setShowTimer] = useState(timerDialog)
  const [calcTimer, setCalcTimer] = useState("NaN")

  const toggleTimer = () => {
    setShowTimer(!showTimer)
  }

  useEffect(() => {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    setCalcTimer(`${hours}hr ${minutes}mins ${seconds}sec`)
  }, [duration])

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
            <div>{`${calcTimer} left for this meeting`}</div>
          </div>
        </div>
      )}
    </>
  )
}
