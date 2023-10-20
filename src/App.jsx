import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login, Room } from "./components";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Test from "./test";
import { Provider } from "react-redux";
import store from "./store";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <ToastContainer className="toast" />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/room/:room" element={<Room />} />
            {/* <Route path="/" element={<Test />} /> */}
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  );
}
