import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Downloads from "./screens/Downloads";
import Library from "./screens/Library";
import Settings from "./screens/Settings";
import Browse from "./screens/Browse";
import SiteDetail from "./screens/SiteDetail";
import { api } from "./lib/rpcClient";
import { useDownloadStore } from "./store";
import View from "./screens/View";
import { queryClient } from "./lib/queryClient";

useDownloadStore.getState();

queryClient.prefetchQuery({
  queryKey: ["catalog-sites"],
  queryFn: () => api.getCatalogSites(),
});

function NotFound() {
  return <h1>404 - Page not found</h1>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex">
          <Sidebar />
          <Routes>
            <Route path="/" element={<Navigate to="/library" />} />
            <Route path="/library" element={<Library />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/browse/:siteId" element={<SiteDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/view/:id" element={<View />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
