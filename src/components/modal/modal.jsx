import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { BiCopy } from "react-icons/bi";
import "./modal.css";
import { toast } from "react-toastify";

export default function Modal({ meeting, members, memCount, roomDetails }) {
  const [participants, setParticipants] = useState(members);
  const [meetingDetails, setMeetingDetails] = useState(meeting);
  const currentURL = window.location.href;

  const toggleMeetingDetails = () => {
    setMeetingDetails(!meetingDetails);
  };

  const toggleParticipants = () => {
    setParticipants(!participants);
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(currentURL);
    toast.success("Meeting URL copied!");
  };

  const toComma = () => {
    return `${memCount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Online`;
  };

  return (
    <>
      {meetingDetails && (
        <div className="modal">
          <div onClick={toggleMeetingDetails} className="overlay"></div>
          <div className="modal-content">
            <div className="modal-top">
              <label className="modal-header">Meeting Details</label>
              <AiOutlineClose
                className="close-btn"
                onClick={toggleMeetingDetails}
              />
            </div>
            <p className="meeting-info">{roomDetails}</p>
            <label className="meeting-url">{currentURL}</label>
            <div className="copy-cover" onClick={copyRoom}>
              <BiCopy className="copy-icon" />
              <label>Copy</label>
            </div>
            <p>
              Disclaimer: People who use this meeting link must signin with
              their student email.
            </p>
          </div>
        </div>
      )}

      {participants && (
        <div className="modal">
          <div onClick={toggleParticipants} className="overlay"></div>
          <div className="modal-content">
            <div className="modal-top">
              <label className="modal-header">Participants</label>
              <AiOutlineClose
                className="close-btn"
                onClick={toggleParticipants}
              />
            </div>
            <p className="meeting-info">{toComma()}</p>
          </div>
        </div>
      )}
    </>
  );
}
