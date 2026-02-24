import type { FC } from "react";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { useHealth } from "../hooks/useHealth";

const Home: FC = () => {
  const { data, isLoading, error } = useHealth();
  const { data: user } = useCurrentUser();
  const { mutate: logoutMutate } = useLogout();

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
      <div className="header">
        <h1>Splitters</h1>
        {user ? (
          <div className="user-info">
            <span>{user.email}</span>
            <button
              className="btn-logout"
              onClick={() => {
                logoutMutate();
              }}
              type="button"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
      <div className="health-status">
        <p>
          Backend Status: <strong>{data?.status}</strong>
        </p>
      </div>
    </div>
  );
};

export default Home;
