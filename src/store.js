import { createStore } from "redux";

const initialState = {
  value: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGGED_IN":
      return {
        ...state,
        value: !state.value,
      };
    default:
      return state;
  }
};

const store = createStore(reducer);

export const toggleValue = () => {
  return {
    type: "LOGGED_IN",
  };
};

export default store;
