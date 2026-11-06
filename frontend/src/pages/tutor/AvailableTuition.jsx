
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AvailableTuition() {
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [messages, setMessages] = useState({});
  const [myApplications, setMyApplications] = useState([]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError("");

      const [offerResponse, applicationResponse] =
        await Promise.all([
          api.get("/tuition-offers/available"),
          api.get("/tuition-offers/my-applications")
        ]);

      setOffers(offerResponse.data.offers || []);
      setMyApplications(
        applicationResponse.data.applications || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Tuition offers load করা যায়নি"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const apply = async (offerId) => {
    if (user?.status !== "active") {
      alert("Apply করার জন্য Admin Approval প্রয়োজন।");
      return;
    }

    if (!window.confirm("এই Tuition-এ Apply করতে চাও?")) {
      return;
    }

    try {
      setApplyingId(offerId);

      await api.post(`/tuition-offers/${offerId}/apply`, {
        message: messages[offerId] || ""
      });

      alert("Application submitted successfully!");
      setMessages((prev) => ({
        ...prev,
        [offerId]: ""
      }));

      await loadOffers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Application submit করা যায়নি"
      );
    } finally {
      setApplyingId(null);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB")
      : "—";

  return (
    <div className="available-tuition-page">
      <header className="available-tuition-header">
        <div>
          <h1>Available Tuitions</h1>
          <p>Find tuition opportunities and apply</p>
        </div>

        <button onClick={loadOffers}>Refresh</button>
      </header>

      {user?.status === "pending" && (
        <div className="tutor-pending-notice">
          Your account is waiting for Admin approval.
          You can view tuition offers, but cannot apply yet.
        </div>
      )}

      {error && (
        <div className="offer-error">{error}</div>
      )}

      {loading ? (
        <p>Loading tuition offers...</p>
      ) : offers.length === 0 ? (
        <div className="offer-empty">
          No available tuition offers right now.
        </div>
      ) : (
        <div className="available-offer-grid">
          {offers.map((offer) => (
            <article className="available-offer-card" key={offer._id}>
              <div className="offer-card-top">
                <span>{offer.offerCode}</span>
                <span className="offer-status open">Open</span>
              </div>

              <h2>{offer.title}</h2>

              <h3>
                ৳{offer.salary.toLocaleString("en-BD")} / month
              </h3>

              <div className="available-offer-details">
                <p><strong>Class:</strong> {offer.classLevel}</p>
                <p><strong>Medium:</strong> {offer.medium}</p>
                <p><strong>Subjects:</strong> {(offer.subjects || []).join(", ")}</p>
                <p><strong>Location:</strong> {offer.area}</p>
                <p><strong>Days:</strong> {offer.daysPerWeek} days/week</p>
                <p><strong>Preferred Tutor:</strong> {offer.preferredTutorGender}</p>
                <p><strong>Qualification:</strong> {offer.tutorQualification || "Any"}</p>
                <p><strong>Deadline:</strong> {formatDate(offer.deadline)}</p>
              </div>

              {offer.description && (
                <p className="available-offer-description">
                  {offer.description}
                </p>
              )}

              {offer.hasApplied ? (
                <div className="application-submitted">
                  Application Status:{" "}
                  <strong>{offer.myApplicationStatus}</strong>
                </div>
              ) : user?.status === "active" ? (
                <>
                  <textarea
                    rows="3"
                    placeholder="Write a short application message (optional)"
                    value={messages[offer._id] || ""}
                    onChange={(e) =>
                      setMessages((prev) => ({
                        ...prev,
                        [offer._id]: e.target.value
                      }))
                    }
                  />

                  <button
                    className="offer-primary-btn"
                    disabled={applyingId === offer._id}
                    onClick={() => apply(offer._id)}
                  >
                    {applyingId === offer._id
                      ? "Applying..."
                      : "Apply for Tuition"}
                  </button>
                </>
              ) : (
                <div className="application-submitted">
                  Admin approval required to apply.
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <section className="my-applications-section">
        <h2>My Applications</h2>

        {myApplications.length === 0 ? (
          <p>You have not applied for any tuition yet.</p>
        ) : (
          myApplications.map((application) => (
            <div
              className="my-application-row"
              key={application._id}
            >
              <div>
                <strong>
                  {application.offer?.title || "Tuition Offer"}
                </strong>
                <p>
                  {application.offer?.area || ""}
                </p>
              </div>

              <span className={`offer-status ${application.status}`}>
                {application.status}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
