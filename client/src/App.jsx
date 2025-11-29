import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeroSection from "./heroSection/HeroSection";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import OccupationModal from "./components/OccupationModal";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Home Page */}
        <Route path="/" element={<HeroSection />} />

        {/* ✅ Auth Pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/occpationmodal" element={<OccupationModal/>}/>
        <Route path ="dashboard" element ={<Dashboard/>}/>
      </Routes>
    </Router>
  );
}

export default App;
