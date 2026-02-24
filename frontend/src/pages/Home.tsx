import type { FC } from "react";
import { useHealth } from "../hooks/useHealth";

const Home: FC = () => {
  const { data, isLoading, error } = useHealth();

  if (isLoading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container error">
        Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Cost Splitter</h1>
      <div className="health-status">
        <p>
          Backend Status: <strong>{data?.status}</strong>
        </p>
      </div>
    </div>
  );
};

export default Home;
