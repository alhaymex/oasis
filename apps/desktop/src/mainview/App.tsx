import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Downloads from "./screens/Downloads";
import Favorites from "./screens/Favorites";
import Library from "./screens/Library";
import Notes from "./screens/Notes";
import Settings from "./screens/Settings";
import Browse from "./screens/Browse";
import SiteDetail from "./screens/SiteDetail";
import { api } from "./lib/rpcClient";
import { useDownloadStore } from "./store";
import View from "./screens/View";
import { useAppConfig } from "./hooks/useAppConfig";
import { applyTheme } from "./lib/theme";
import { queryClient } from "./lib/queryClient";

useDownloadStore.getState();

queryClient.prefetchQuery({
  queryKey: ["catalog-sites"],
  queryFn: () => api.getCatalogSites(),
});

queryClient.prefetchQuery({
  queryKey: ["app-config"],
  queryFn: async () => {
    const data = await api.getConfig();
    if (!data) {
      throw new Error("Config not available");
    }
    return data;
  },
});

function NotFound() {
  return <h1>404 - Page not found</h1>;
}

function AppShell() {
  const { data: config } = useAppConfig();

  useEffect(() => {
    const activeTheme = config?.theme.themes.find((theme) => theme.id === config.theme.active);
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, [config]);

  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to="/library" />} />
          <Route path="/library" element={<Library />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/browse/:siteId" element={<SiteDetail />} />
          <Route path="/favorite" element={<Navigate to="/favorites" replace />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/theme" element={<Navigate to="/settings" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/view/:id" element={<View />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
};

export default App;
