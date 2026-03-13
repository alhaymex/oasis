import { HashRouter, Link, Route, Routes } from "react-router-dom";
import Settings from "./screens/Settings";
import Download from "./screens/Download";
import Sidebar from "./components/Sidebar";
import { api } from "./lib/rpcClient";

const App = () => {
  const handleClick = () => {
    api.ping("PING from Client!");
  }
  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/library" element={<button onClick={handleClick}>Library</button>} />
          <Route path="/download" element={<Download />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
