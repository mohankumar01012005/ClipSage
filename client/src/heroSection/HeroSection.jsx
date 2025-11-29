import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import RobotAnimations from "../assets/Robot Futuristic Ai animated.json";
import bgImage from "../assets/backgroundimg.jpg";
import { useNavigate } from "react-router-dom";
import FeaturesSection from "../pages/features";
import Footer from "../pages/footer";

export default function HeroSection() {
  const words = [
    "your future",
    "your success",
    "your growth",
    "your learning",
    "your productivity",
  ];

  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // ✅ AUTH STATE FROM LOCAL STORAGE
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ CHECK LOGIN STATUS ON LOAD
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ LOGOUT FUNCTION — use same key you stored
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // keep key consistent
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    navigate("/signin");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFade(true);
      }, 400);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Smooth scroll helper
  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // fallback to route if anchor isn't present (e.g., different page)
      navigate("/features");
    }
  };

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >

        <section className="relative min-h-screen w-full flex flex-col items-center justify-start text-center overflow-hidden">
          {/* 🌟 UNIQUE NAVBAR */}
          <nav className="fixed top-6 w-[90%] mx-auto z-50">
            <div className="mx-auto w-fit px-10 py-3 rounded-full backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_25px_rgba(0,0,0,0.15)] flex items-center gap-10">
              {["Home", "Features", "Pricing"].map((item) => (
                <div key={item} className="relative group">
                  <span
                    className="font-semibold text-gray-700 cursor-pointer transition"
                    onClick={() => {
                      if (item === "Home") {
                        // navigate to profile/home route
                        navigate("/dashboard");
                      } else if (item === "Features") {
                        // smooth scroll to #features on the same page
                        scrollToFeatures();
                      } else if (item === "Pricing") {
                        navigate("/pricing");
                      }
                    }}
                  >
                    {item}
                  </span>
                  <div className="absolute left-0 right-0 mx-auto h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
                </div>
              ))}

              {/* ✅ LOGIN / LOGOUT TOGGLE */}
              {!isLoggedIn ? (
                <button
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all cursor-pointer"
                  onClick={() => {
                    navigate("/signin");
                  }}
                >
                  Log In
                </button>
              ) : (
                <button
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-red-200 transition-all cursor-pointer"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              )}
            </div>
          </nav>

          {/* 🌟 HERO CONTENT */}
          <div className="mt-40 max-w-3xl flex flex-col items-center px-6">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 animate-fade-in">
              ClipSage watches videos for{" "}
              <span
                className={`bg-gradient-to-r from-blue-600 h-20 to-blue-400 bg-clip-text text-transparent inline-block transition-opacity duration-500 ease-in-out ${fade ? "opacity-100" : "opacity-0"
                  }`}
              >
                {words[index]}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl animate-fade-in-delay">
              ClipSage understands your videos the way you wish you could. Ask
              any question and jump instantly to the exact moment that matters.
              Powered by advanced AI that transforms long tutorials into actionable insight.
            </p>

            <div className="flex gap-6 mt-10 animate-fade-in-delay">
            {localStorage.getItem("userId") ?  <button
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                Get Started
              </button> : <button
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                onClick={() => navigate("/signin")}
              >
                Get Started
              </button>} 
              <button className="px-8 py-3 rounded-full border border-gray-400 backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all cursor-pointer">
                Watch Demo
              </button>
            </div>
          </div>

          {/* 🤖 Lottie Animation */}
          <div className="w-full flex justify-center mt-16 mb-20">
            <div className="w-64 md:w-80 drop-shadow-[0_0_30px_rgba(30,144,255,0.35)]">
              <Lottie animationData={RobotAnimations} loop={true} />
            </div>
          </div>
        </section>
      </div>

      {/* Make sure FeaturesSection or the element inside it uses id="features" */}
      <FeaturesSection id="features" />
      <Footer></Footer>
    </>
  );
}