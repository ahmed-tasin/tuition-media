
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "guardian"
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const user = await register(form);

      if (user.role === "tutor" && user.status === "pending") {
        setSuccess(
          "Registration successful! Your account is waiting for admin approval. You can login after approval."
        );
        return;
      }

      navigate("/guardian", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h1>Create Account</h1>

        {error && <div className="error">{error}</div>}

        {success && (
          <div className="success">
            {success}
            <p>
              <Link to="/login">Go to Login</Link>
            </p>
          </div>
        )}

        {!success && (
          <>
            <label>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
            />

            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />

            <label>Account Type</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="guardian">Parent / Guardian</option>
              <option value="tutor">Tutor / Teacher</option>
            </select>

            <button disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>

            <p>
              Already registered? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
