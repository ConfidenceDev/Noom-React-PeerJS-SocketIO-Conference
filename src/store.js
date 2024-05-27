import { createStore } from "redux"

const initialState = {
  socket: null,
  loggedIn: false,
  meeting: null,
  user: null,
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "SOCKET":
      return {
        ...state,
        socket: action.payload.socket,
      }
    case "LOGGED_IN":
      return {
        ...state,
        loggedIn: !state.loggedIn,
      }
    case "SET_MEETING_AND_USER":
      return {
        ...state,
        meeting: action.payload.meeting,
        user: action.payload.user,
      }

    default:
      return state
  }
}

const store = createStore(reducer)

export const loadSocket = (socket) => {
  return {
    type: "SOCKET",
    payload: {
      socket,
    },
  }
}

export const toggleLogin = () => {
  return {
    type: "LOGGED_IN",
  }
}

export const setMeetingAndUser = (meeting, user) => {
  return {
    type: "SET_MEETING_AND_USER",
    payload: {
      meeting,
      user,
    },
  }
}

export default store
