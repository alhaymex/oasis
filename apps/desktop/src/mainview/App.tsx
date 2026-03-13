import { HashRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Download from "./screens/Download";
import Library from "./screens/Library";
import Settings from "./screens/Settings";

const App = () => {
  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/library" element={<Library />} />
          <Route path="/download" element={<Download />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
