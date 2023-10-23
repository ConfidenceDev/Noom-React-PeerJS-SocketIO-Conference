import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login, Room } from "./components";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <ToastContainer className="toast" />
          <Routes>
            <Route path="/lecture/:room" element={<Login />} />
            <Route path="/lecture/:room/:access" element={<Room />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  );
}
