"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import axios from "axios";

export default function OccupationModal() {
  const navigate = useNavigate();
  const [occupation, setOccupation] = useState("");
  const [customOccupation, setCustomOccupation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const occupationOptions = ["Student", "Graduate", "Employee", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // client-side validation
    if (!occupation) {
      setError("Please select an occupation");
      return;
    }
    if (occupation === "Other" && !customOccupation.trim()) {
      setError("Please enter your occupation");
      return;
    }

    const selectedValue = occupation === "Other" ? customOccupation.trim() : occupation;

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) {
      setError("Authentication required. Please login again.");
      return;
    }

    const url = `http://localhost:5005/api/auth/users/${userId}/occupation`; // adjust if your backend route is different
    const payload = { occupation: selectedValue };

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.put(url, payload, { headers });

      // handle expected successful response shape (adjust if your backend returns another shape)
      if (response.status >= 200 && response.status < 300) {
        // optional: if backend returns updated user or message use it:
        // const data = response.data;
        // console.log("Occupation update response:", data);

        setLoading(false);
        navigate("/dashboard");
      } else {
        setLoading(false);
        setError(response.data?.message || "Occupation update failed. Please try again.");
      }
    } catch (err) {
      console.error("Occupation update error:", err);
      setLoading(false);
      // prefer server message if present
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please check your connection.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-5 blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200 rounded-full opacity-5 blur-3xl -ml-40 -mb-40"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <Briefcase className="text-blue-400" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-600">Tell us about your occupation</p>
        </div>

        {/* Modal Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Occupation Dropdown */}
            <div>
              <label htmlFor="occupation" className="block text-sm font-semibold text-slate-700 mb-3">
                What is your occupation?
              </label>
              <select
                id="occupation"
                value={occupation}
                onChange={(e) => {
                  setOccupation(e.target.value);
                  setCustomOccupation("");
                  setError("");
                }}
                className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition appearance-none cursor-pointer text-slate-900 font-medium"
                style={{
                  backgroundImage:
                    `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="">Select an option...</option>
                {occupationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Custom Occupation Input */}
            {occupation === "Other" && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="customOccupation" className="block text-sm font-semibold text-slate-700 mb-2">
                    Enter Your Occupation
                  </label>
                  <input
                    id="customOccupation"
                    type="text"
                    value={customOccupation}
                    onChange={(e) => {
                      setCustomOccupation(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g., Freelancer, Entrepreneur..."
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-slate-900"
                  />
                </div>
                <p className="text-xs text-slate-500 italic">
                  Enter proper occupation to get full use of the application
                </p>
              </div>
            )}

            {/* Info Message for Selected Occupations */}
            {occupation && occupation !== "Other" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{occupation}</span> selected. You're all set!
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {loading ? "Setting up..." : "Continue"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Skip Note */}
          <p className="text-center text-slate-500 text-sm mt-6">
            You can update this later in your{" "}
            <a href="#" className="text-blue-500 hover:underline font-medium">
              account settings
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
