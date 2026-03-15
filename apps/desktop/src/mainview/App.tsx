import { HashRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Downloads from "./screens/Downloads";
import Library from "./screens/Library";
import Settings from "./screens/Settings";
import Browse from "./screens/Browse";
import SiteDetail from "./screens/SiteDetail";
import { api } from "./lib/rpcClient";
import { useDownloadStore } from "./store";

const queryClient = new QueryClient();

useDownloadStore.getState();

queryClient.prefetchQuery({
  queryKey: ["store-catalog"],
  queryFn: async () => {
    const data = await api.getStoreCatalog();
    if (!data || !data.sites) throw new Error("Catalog not available");
    return data;
  },
});

function NotFound() {
  return <h1>404 - Page not found</h1>
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex">
          <Sidebar />
          <Routes>
            <Route path="/library" element={<Library />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/browse/:siteId" element={<SiteDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;

