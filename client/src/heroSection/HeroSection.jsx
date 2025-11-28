import Lottie from "lottie-react";
import RobotAnimations from "../assets/Robot Futuristic Ai animated.json";
import "./herosection.css";

export default function HeroSection() {
  return (
    <section 
      className="relative min-h-screen w-full flex flex-col items-center justify-start text-center overflow-hidden">

      {/* 🌟 UNIQUE NAVBAR (Floating Glass Pill + Magnet Hover) */}
      <nav className="fixed top-6 w-[90%] mx-auto z-50">
        <div className="mx-auto w-fit px-10 py-3 rounded-full backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_25px_rgba(0,0,0,0.15)] flex items-center gap-10">
          
          <div className="relative group">
            <span className="font-semibold text-gray-700 cursor-pointer transition">
              Home
            </span>
            <div className="absolute left-0 right-0 mx-auto h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
          </div>

          <div className="relative group">
            <span className="font-semibold text-gray-700 cursor-pointer transition">
              Features
            </span>
            <div className="absolute left-0 right-0 mx-auto h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
          </div>

          <div className="relative group">
            <span className="font-semibold text-gray-700 cursor-pointer transition">
              Pricing
            </span>
            <div className="absolute left-0 right-0 mx-auto h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
          </div>

          <div className="relative group">
            <span className="font-semibold text-gray-700 cursor-pointer transition">
              Docs
            </span>
            <div className="absolute left-0 right-0 mx-auto h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
          </div>

          <button className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all">
            Log In
          </button>
        </div>
      </nav>

      {/* 🌟 HERO SECTION */}
      <div className="mt-40 max-w-3xl flex flex-col items-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 animate-fade-in">
          ClipSage  watches videos 
          <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"> for you </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl animate-fade-in-delay">
          Build powerful prompts, automate workflows, and boost productivity with a platform built for creators who value clarity and control. Powered by leading LLMs like Gemini to help you save time, learn faster, and create smarter.
        </p>

        <div className="flex gap-6 mt-10 animate-fade-in-delay">
          <button className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all">
            Get Started
          </button>
          <button className="px-8 py-3 rounded-full border border-gray-400 backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all">
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
  );
}
