"use client";

import { useState, useEffect } from "react";
import {
  FiMail, FiCopy, FiCheck, FiStar, FiZap, FiPlayCircle, FiClock, FiArrowRight, FiTrendingUp
} from "react-icons/fi";
import { Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // get userId from localStorage
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    async function fetchUser() {
      if (!userId) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5005/api/auth/getUser/${userId}`);
        setUserData(res.data.user);
      } catch (err) {
        console.error("Fetch user error:", err);
        setError(err?.response?.data?.error || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  const getMemberSinceDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleCopyEmail = async () => {
    if (!userData?.email) return;
    try {
      await navigator.clipboard.writeText(userData.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");
    navigate("/signin");
  };

  // Simple loading / error state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading profile…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // fallback if no userData
  const u = userData ?? {
    username: "Unknown",
    email: "",
    isPremium: false,
    premiumType: null,
    credits: 0,
    createdAt: null,
    userChats: [],
  };

  const StatCard = ({ icon, value, label, bgColor, borderColor, iconBgColor, iconColor, textColor }) => (
    <div className={`${bgColor} rounded-xl border ${borderColor} p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className={`${iconBgColor} rounded-lg p-3 flex-shrink-0`}>
          <div className={`${iconColor}`}>{icon}</div>
        </div>
        <div className="flex-1">
          <p className={`text-3xl font-bold ${textColor} mb-1`}>{value}</p>
          <p className={`text-sm ${textColor} opacity-75`}>{label}</p>
        </div>
      </div>
    </div>
  );

  const VideoChatCard = ({ chat }) => (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">{chat.title}</h4>
          <p className="text-gray-600 line-clamp-2 text-sm mb-3">{chat.summary}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <FiClock className="w-4 h-4" />
          {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : ""}
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200" onClick={()=>{navigate("/dashboard")}}>
          View Chat
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <div className="flex justify-end mt-5 gap-3 mr-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-150"
        >
          <Home size={16} />
          Home
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors duration-150"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">{(u.username || "U")[0]?.toUpperCase()}</span>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{u.username}</h2>
              <div className="flex items-center gap-3 mb-4">
                <FiMail className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">{u.email}</span>
                <button onClick={handleCopyEmail} className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Copy email">
                  {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-3">Member since {getMemberSinceDate(u.createdAt)}</p>

              <div className="flex gap-3">
                {u.isPremium ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-medium border border-yellow-200">
                    <FiStar className="w-4 h-4" />
                    Premium - {u.premiumType}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium border border-gray-300">
                    <FiZap className="w-4 h-4" />
                    Free Plan
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
            <StatCard
              icon={<FiPlayCircle className="w-6 h-6" />}
              value={Array.isArray(u.userChats) ? u.userChats.length : 0}
              label="Video Chats"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              textColor="text-blue-900"
            />
            <StatCard
              icon={<FiZap className="w-6 h-6" />}
              value={u.credits ?? 0}
              label="Credits Available"
              bgColor="bg-green-50"
              borderColor="border-green-200"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              textColor="text-green-900"
            />
            <StatCard
              icon={<FiStar className="w-6 h-6" />}
              value={u.isPremium ? "Premium" : "Free"}
              label="Account Status"
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              textColor="text-purple-900"
            />
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiPlayCircle className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">Your Recent Videos</h3>
          </div>

          {Array.isArray(u.userChats) && u.userChats.length > 0 ? (
            <div className="space-y-4">
              {u.userChats.map((chat, index) => (
                <VideoChatCard key={index} chat={chat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiPlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No videos yet</p>
              <p className="text-gray-400 text-sm mb-6">Start by uploading a video to get insights</p>
              <button onClick={() => navigate("/summarize")} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                Upload Your First Video
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
