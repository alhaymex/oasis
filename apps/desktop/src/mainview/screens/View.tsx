import { useParams } from "react-router-dom";

type RouteParams = {
  id: string;
};
const baseUrl = "http://localhost:9999";

function View() {
  const { id } = useParams<RouteParams>();

  const iframeSrc = `${baseUrl}/content/${id}`;

  return (
    <div className="relative w-full h-screen p-3 ">
      <iframe
        src={iframeSrc}
        className="rounded-lg"
        title="Site Viewer"
        width="100%"
        height="100%"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  );
}

export default View;
