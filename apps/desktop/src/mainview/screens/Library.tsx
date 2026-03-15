import { useLibrary } from "../hooks/useLibrary";

function Library() {
  const { data, isLoading } = useLibrary();

  if (isLoading) return <h1>Loading library</h1>
  
  return <main className="p-3">{data && data?.length > 0 && data?.map((d) => <h1 key={d}>{d}</h1>)}</main>;
}

export default Library;
