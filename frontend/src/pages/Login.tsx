import type { FC } from "react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCurrentUser, useLogin } from "../hooks/useAuth";

const Login: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: loginMutate, isPending, error } = useLogin();
  const { data: user } = useCurrentUser();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    loginMutate({ email, password });
  };

  const serverError = error?.response?.data.message;

  return (
    <div className="container">
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
          />
        </div>
        {serverError ? <p className="form-error">{serverError}</p> : null}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="auth-link">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
};

export default Login;
