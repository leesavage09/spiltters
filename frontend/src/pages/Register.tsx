import type { FC } from "react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCurrentUser, useRegister } from "../hooks/useAuth";

const Register: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");
  const { mutate: registerMutate, isPending, error } = useRegister();
  const { data: user } = useCurrentUser();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setClientError("");

    if (password !== confirmPassword) {
      setClientError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters");
      return;
    }

    registerMutate({ email, password });
  };

  const displayError = clientError || error?.response?.data.message || "";

  return (
    <div className="container">
      <h1>Create Account</h1>
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
            minLength={8}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
            required
            minLength={8}
          />
        </div>
        {displayError ? <p className="form-error">{displayError}</p> : null}
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="auth-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
