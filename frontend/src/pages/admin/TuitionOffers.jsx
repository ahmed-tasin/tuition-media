
import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

const emptyForm = {
  title: "",
  classLevel: "",
  medium: "Bangla Version",
  subjects: "",
  area: "",
  salary: "",
  daysPerWeek: "4",
  preferredTutorGender: "Any",
  tutorQualification: "",
  description: "",
  deadline: ""
};

export default function TuitionOffers() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/tuition-offers/admin/all"
      );

      setOffers(response.data.offers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Offers load করা যায়নি"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        salary: Number(form.salary),
        daysPerWeek: Number(form.daysPerWeek),
        subjects: form.subjects
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        deadline: new Date(form.deadline).toISOString()
      };

      if (editingId) {
        await api.patch(
          `/tuition-offers/${editingId}`,
          payload
        );
      } else {
        await api.post("/tuition-offers", payload);
      }

      resetForm();
      await loadOffers();
      alert(
        editingId
          ? "Offer updated successfully"
          : "Tuition offer published successfully"
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Offer save করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  const editOffer = (offer) => {
    setEditingId(offer._id);

    setForm({
      title: offer.title || "",
      classLevel: offer.classLevel || "",
      medium: offer.medium || "Bangla Version",
      subjects: (offer.subjects || []).join(", "),
      area: offer.area || "",
      salary: String(offer.salary || ""),
      daysPerWeek: String(offer.daysPerWeek || 4),
      preferredTutorGender:
        offer.preferredTutorGender || "Any",
      tutorQualification: offer.tutorQualification || "",
      description: offer.description || "",
      deadline: offer.deadline
        ? new Date(offer.deadline).toISOString().slice(0, 10)
        : ""
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateStatus = async (offer, status) => {
    if (!window.confirm(`Offer ${status} করতে চাও?`)) return;

    try {
      await api.patch(`/tuition-offers/${offer._id}`, {
        status
      });

      await loadOffers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Status update করা যায়নি"
      );
    }
  };

  const deleteOffer = async (offer) => {
    if (
      !window.confirm(
        "এই Offer এবং এর সব Applications স্থায়ীভাবে Delete হবে। নিশ্চিত?"
      )
    ) return;

    try {
      await api.delete(`/tuition-offers/${offer._id}`);
      await loadOffers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Offer delete করা যায়নি"
      );
    }
  };

  const viewApplications = async (offer) => {
    try {
      const response = await api.get(
        `/tuition-offers/admin/${offer._id}/applications`
      );

      setSelectedOffer(offer);
      setApplications(response.data.applications || []);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Applications load করা যায়নি"
      );
    }
  };

  const selectTutor = async (applicationId) => {
    if (
      !window.confirm(
        "এই Tutor-কে Select ও Assign করতে চাও? অন্য Applications Reject হবে।"
      )
    ) return;

    try {
      await api.post(
        "/tuition-offers/admin/select-tutor",
        { applicationId }
      );

      alert("Tutor assigned successfully");
      setSelectedOffer(null);
      setApplications([]);
      await loadOffers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Tutor assign করা যায়নি"
      );
    }
  };

  const dateText = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB")
      : "—";

  return (
    <div className="tuition-admin">
      <div className="tuition-admin-heading">
        <div>
          <h1>Tuition Offers</h1>
          <p>Create and manage tuition opportunities</p>
        </div>

        <button
          className="offer-primary-btn"
          onClick={() => {
            if (showForm) resetForm();
            else {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Create Offer"}
        </button>
      </div>

      {error && (
        <div className="offer-error">{error}</div>
      )}

      {showForm && (
        <form
          className="offer-form"
          onSubmit={handleSubmit}
        >
          <h2>
            {editingId ? "Edit Tuition Offer" : "Create Tuition Offer"}
          </h2>

          <div className="offer-form-grid">
            <label>
              Offer Title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="Class 9 Science Tuition"
              />
            </label>

            <label>
              Class *
              <input
                name="classLevel"
                value={form.classLevel}
                onChange={handleChange}
                required
                placeholder="Class 9"
              />
            </label>

            <label>
              Medium
              <select
                name="medium"
                value={form.medium}
                onChange={handleChange}
              >
                <option>Bangla Version</option>
                <option>English Version</option>
                <option>English Medium</option>
                <option>Madrasa</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Subjects * (Comma separated)
              <input
                name="subjects"
                value={form.subjects}
                onChange={handleChange}
                required
                placeholder="Math, Physics, Chemistry"
              />
            </label>

            <label>
              Location / Area *
              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                required
                placeholder="Town Hall, Mymensingh"
              />
            </label>

            <label>
              Monthly Salary (৳) *
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                min="1"
                required
              />
            </label>

            <label>
              Days Per Week *
              <select
                name="daysPerWeek"
                value={form.daysPerWeek}
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {day} Days
                  </option>
                ))}
              </select>
            </label>

            <label>
              Preferred Tutor
              <select
                name="preferredTutorGender"
                value={form.preferredTutorGender}
                onChange={handleChange}
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

            <label>
              Tutor Qualification
              <input
                name="tutorQualification"
                value={form.tutorQualification}
                onChange={handleChange}
                placeholder="University student"
              />
            </label>

            <label>
              Application Deadline *
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                min={new Date().toLocaleDateString("en-CA")}
                required
              />
            </label>
          </div>

          <label className="offer-description">
            Additional Requirements
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              maxLength={3000}
              placeholder="Write tuition details..."
            />
          </label>

          <button
            type="submit"
            className="offer-primary-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Offer"
              : "Publish Offer"}
          </button>
        </form>
      )}

      {selectedOffer && (
        <div className="offer-modal-backdrop">
          <div className="offer-modal">
            <div className="offer-modal-heading">
              <div>
                <h2>Applications</h2>
                <p>{selectedOffer.title}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedOffer(null);
                  setApplications([]);
                }}
              >
                Close
              </button>
            </div>

            {applications.length === 0 ? (
              <p>No applications received yet.</p>
            ) : (
              applications.map((application) => (
                <div
                  className="offer-applicant"
                  key={application._id}
                >
                  <div>
                    <strong>
                      {application.tutor?.name || "Unknown Tutor"}
                    </strong>
                    <p>
                      Phone: {application.tutor?.phone || "—"}
                    </p>
                    <p>
                      Account: {application.tutor?.status || "—"}
                    </p>
                    <p>
                      Applied: {dateText(application.appliedAt)}
                    </p>
                    <p>
                      Message: {application.message || "No message"}
                    </p>
                    <span className={`offer-status ${application.status}`}>
                      {application.status}
                    </span>
                  </div>

                  {application.status === "pending" &&
                    !selectedOffer.assignedTutor && (
                      <button
                        className="offer-select-btn"
                        onClick={() =>
                          selectTutor(application._id)
                        }
                      >
                        Select Tutor
                      </button>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="offer-list-heading">
        <h2>All Tuition Offers</h2>
        <button onClick={loadOffers}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading offers...</p>
      ) : offers.length === 0 ? (
        <div className="offer-empty">
          No tuition offers yet. Create your first offer.
        </div>
      ) : (
        <div className="offer-cards">
          {offers.map((offer) => (
            <article className="offer-card" key={offer._id}>
              <div className="offer-card-top">
                <span>{offer.offerCode}</span>
                <span className={`offer-status ${offer.status}`}>
                  {offer.status}
                </span>
              </div>

              <h3>{offer.title}</h3>

              <p>
                {offer.classLevel} · {offer.medium}
              </p>

              <h2>৳{offer.salary.toLocaleString("en-BD")} / month</h2>

              <div className="offer-details">
                <p>Subjects: {(offer.subjects || []).join(", ")}</p>
                <p>Area: {offer.area}</p>
                <p>Days: {offer.daysPerWeek} / week</p>
                <p>Preferred: {offer.preferredTutorGender}</p>
                <p>Deadline: {dateText(offer.deadline)}</p>
                <p>Applications: {offer.applicationCount || 0}</p>
                <p>
                  Assigned: {offer.assignedTutor?.name || "Not assigned"}
                </p>
              </div>

              <div className="offer-card-actions">
                <button onClick={() => editOffer(offer)}>
                  Edit
                </button>

                <button onClick={() => viewApplications(offer)}>
                  Applications
                </button>

                {offer.status === "open" && !offer.assignedTutor && (
                  <button onClick={() => updateStatus(offer, "paused")}>
                    Pause
                  </button>
                )}

                {offer.status === "paused" && !offer.assignedTutor && (
                  <button onClick={() => updateStatus(offer, "open")}>
                    Resume
                  </button>
                )}

                {!offer.assignedTutor && offer.status !== "closed" && (
                  <button onClick={() => updateStatus(offer, "closed")}>
                    Close
                  </button>
                )}

                <button
                  className="offer-delete-btn"
                  onClick={() => deleteOffer(offer)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
