import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TuitionOffers from "./TuitionOffers";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserRound,
  Clock,
  CheckCircle,
  Ban,
  Search,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Check,
  XCircle,
  BookOpen,
} from "lucide-react";

const initialStats = {
  totalUsers: 0,
  totalTutors: 0,
  totalGuardians: 0,
  totalAdmins: 0,
  pendingTutors: 0,
  activeUsers: 0,
  suspendedUsers: 0,
  rejectedTutors: 0,
};

const statusColors = {
  active: "active",
  pending: "pending",
  suspended: "suspended",
  rejected: "rejected",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/admin/dashboard");

      setStats({
        ...initialStats,
        ...response.data.stats,
      });

      setRecentUsers(response.data.recentUsers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Dashboard data load করা যায়নি");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: 20,
          search,
          role,
          status,
        },
      });

      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "User list load করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === "users" || activeTab === "pending") {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  const changeStatus = async (id, newStatus) => {
    const confirmText = `এই User-এর Status ${newStatus} করতে চাও?`;

    if (!window.confirm(confirmText)) return;

    try {
      setUpdatingId(id);

      await api.patch(`/admin/users/${id}/status`, {
        status: newStatus,
      });

      await Promise.all([loadDashboard(), loadUsers()]);
    } catch (err) {
      alert(err.response?.data?.message || "Status update করা যায়নি");
    } finally {
      setUpdatingId(null);
    }
  };

const openTab = (tab) => {
  setActiveTab(tab);
  setSidebarOpen(false);
  setPage(1);

  if (tab === "users") {
    setRole("");
    setStatus("");
  }

  if (tab === "overview") {
    loadDashboard();
  }
};

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Tutors",
      value: stats.totalTutors,
      icon: GraduationCap,
      color: "purple",
    },
    {
      label: "Guardians",
      value: stats.totalGuardians,
      icon: UserRound,
      color: "green",
    },
    {
      label: "Pending Tutors",
      value: stats.pendingTutors,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: CheckCircle,
      color: "teal",
    },
    {
      label: "Suspended Users",
      value: stats.suspendedUsers,
      icon: Ban,
      color: "red",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderUsers = () => (
    <>
      <div className="admin-filters">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="tutor">Tutor</option>
          <option value="guardian">Guardian</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>

        <button className="admin-refresh" onClick={loadUsers} title="Refresh">
          <RefreshCw size={17} />
        </button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading users...</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.phone}</td>
                    <td>
                      <span className="role-badge">{item.role}</span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${statusColors[item.status] || ""
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      {item.role !== "admin" && (
                        <div className="admin-actions">
                          {item.status !== "active" && (
                            <button
                              className="action-approve"
                              disabled={updatingId === item._id}
                              onClick={() => changeStatus(item._id, "active")}
                              title="Approve / Activate"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {item.role === "tutor" &&
                            item.status !== "rejected" && (
                              <button
                                className="action-reject"
                                disabled={updatingId === item._id}
                                onClick={() =>
                                  changeStatus(item._id, "rejected")
                                }
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            )}

                          {item.status !== "suspended" && (
                            <button
                              className="action-suspend"
                              disabled={updatingId === item._id}
                              onClick={() =>
                                changeStatus(item._id, "suspended")
                              }
                              title="Suspend"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">TM</div>
          <div>
            <h2>Tuition Media</h2>
            <small>Administration</small>
          </div>
          <button
            className="admin-close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <button
            className={activeTab === "overview" ? "selected" : ""}
            onClick={() => openTab("overview")}
          >
            <LayoutDashboard size={19} />
            Overview
          </button>

          <button
            className={activeTab === "users" ? "selected" : ""}
            onClick={() => openTab("users")}
          >
            <Users size={19} />
            All Users
          </button>

          <button
            className={activeTab === "pending" ? "selected" : ""}
            onClick={() => {
              setRole("tutor");
              setStatus("pending");
              openTab("pending");
            }}
          >
            <Clock size={19} />
            Pending Tutors
            {stats.pendingTutors > 0 && (
              <span className="nav-count">{stats.pendingTutors}</span>
            )}
          </button>

          <button
            className={activeTab === "tuition-offers" ? "selected" : ""}
            onClick={() => openTab("tuition-offers")}
          >
            <BookOpen size={19} />
            Tuition Offers
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user?.name || "Admin"}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button className="admin-logout" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>
              {activeTab === "overview"
                ? "Dashboard Overview"
                : activeTab === "pending"
                  ? "Pending Tutor Applications"
                  : activeTab === "tuition-offers"
                    ? "Tuition Offers Management"
                    : "User Management"}
            </h1>
            <p>Welcome back, {user?.name}</p>
          </div>

          {activeTab !== "tuition-offers" && (
            <button
              className="admin-refresh"
              onClick={() =>
                activeTab === "overview"
                  ? loadDashboard()
                  : loadUsers()
              }
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          )}
        </header>

        {error && <div className="admin-error">{error}</div>}

        {activeTab === "overview" && (
          <>
            <section className="admin-stat-grid">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div className="admin-stat-card" key={card.label}>
                    <div className={`stat-icon ${card.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <p>{card.label}</p>
                      <h2>{card.value}</h2>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent Registrations</h2>
                  <p>Latest registered users</p>
                </div>

                <button onClick={() => openTab("users")}>View All</button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentUsers.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.phone}</td>
                        <td>{item.role}</td>
                        <td>
                          <span
                            className={`status-badge ${statusColors[item.status] || ""
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}

                    {recentUsers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty-row">
                          No registrations yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {(activeTab === "users" || activeTab === "pending") && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>
                  {activeTab === "pending"
                    ? "Pending Tutor Applications"
                    : "All Registered Users"}
                </h2>
                <p>Manage accounts and registration status</p>
              </div>
            </div>

            {renderUsers()}
          </section>
        )}

        {activeTab === "tuition-offers" && <TuitionOffers />}
      </main>
    </div>
  );
}
