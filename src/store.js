import { createStore } from "redux";

const initialState = {
  loggedIn: false,
  meeting: null,
  user: null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGGED_IN":
      return {
        ...state,
        loggedIn: !state.loggedIn,
      };
    case "SET_MEETING_AND_USER":
      return {
        ...state,
        meeting: action.payload.meeting,
        user: action.payload.user,
      };

    default:
      return state;
  }
};

const store = createStore(reducer);

export const toggleLogin = () => {
  return {
    type: "LOGGED_IN",
  };
};

export const setMeetingAndUser = (meeting, user) => {
  return {
    type: "SET_MEETING_AND_USER",
    payload: {
      meeting,
      user,
    },
  };
};

export default store;
