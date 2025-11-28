import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeroSection from "./heroSection/HeroSection";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Home Page */}
        <Route path="/" element={<HeroSection />} />

        {/* ✅ Auth Pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
