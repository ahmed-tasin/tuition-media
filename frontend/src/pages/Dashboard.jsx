
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const titles = {
    admin: "Admin Dashboard",
    tutor: "Tutor Dashboard",
    guardian: "Guardian Dashboard"
  };

  const isPendingTutor =
    user?.role === "tutor" && user?.status === "pending";

  const isActive = user?.status === "active";

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Tuition Media</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <main className="dashboard-content">
        <h1>{titles[user?.role] || "Dashboard"}</h1>

        {/* User Information */}
        <div className="welcome-card">
          <h2>Welcome, {user?.name}</h2>
          <p>Phone: {user?.phone}</p>
          <p>Role: {user?.role}</p>
          <p>Location: {user?.address || "Mymensingh"}</p>
          <p>Status: {user?.status}</p>
        </div>

        {/* Pending Tutor */}
        {isPendingTutor && (
          <div className="status-card pending">
            <h2>Application Under Review</h2>
            <p>
              তোমার Tutor Registration সফল হয়েছে।
              Admin তোমার আবেদন যাচাই করছে।
            </p>
            <p>
              অনুমোদন পাওয়ার পর তুমি Tutor Dashboard-এর
              সকল সুবিধা ব্যবহার করতে পারবে।
            </p>
          </div>
        )}

        {/* Rejected Tutor */}
        {user?.role === "tutor" &&
          user?.status === "rejected" && (
            <div className="status-card rejected">
              <h2>Application Rejected</h2>
              <p>
                দুঃখিত, তোমার Tutor আবেদনটি অনুমোদিত হয়নি।
                বিস্তারিত জানতে Admin-এর সঙ্গে যোগাযোগ করো।
              </p>
            </div>
          )}

        {/* Suspended Account */}
        {user?.status === "suspended" && (
          <div className="status-card rejected">
            <h2>Account Suspended</h2>
            <p>
              তোমার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ রয়েছে।
              Admin-এর সঙ্গে যোগাযোগ করো।
            </p>
          </div>
        )}

        {/* Active Tutor */}
        {isActive && user?.role === "tutor" && (
          <>
            <div className="status-card active">
              <h2>Account Approved</h2>
              <p>তোমার Tutor Account সক্রিয় রয়েছে।</p>
            </div>

            <div className="tutor-dashboard-actions">
              <Link to="/tutor/available-tuitions">
                Browse Available Tuitions
              </Link>
            </div>
          </>
        )}

        {/* Guardian */}
        {isActive && user?.role === "guardian" && (
          <div className="status-card active">
            <h2>Welcome to Tuition Media</h2>
            <p>তোমার Guardian Account সক্রিয় রয়েছে।</p>
          </div>
        )}

        {/* Admin */}
        {isActive && user?.role === "admin" && (
          <div className="status-card active">
            <h2>Administrator Access</h2>
            <p>Admin account সক্রিয় রয়েছে।</p>

            <Link to="/admin">
              Go to Admin Panel
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
