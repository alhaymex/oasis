import { HashRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Downloads from "./screens/Downloads";
import Library from "./screens/Library";
import Settings from "./screens/Settings";
import Browse from "./screens/Browse";

function NotFound() {
  return <h1>404 - Page not found</h1>
}

const App = () => {
  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/library" element={<Library />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
