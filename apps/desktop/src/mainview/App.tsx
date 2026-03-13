import { HashRouter, Link, Route, Routes } from "react-router-dom";
import Settings from "./screens/Settings";
import Download from "./screens/Download";
import Sidebar from "./components/Sidebar";

const App = () => {
  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/" element={<h1 className="">Library</h1>} />
          <Route path="/download" element={<Download />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
