import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Allocator from "./pages/Allocator";
import CheckoutDemo from "./pages/CheckoutDemo";
import Tracking from "./pages/Tracking";
import ChatAssistant from "./pages/ChatAssistant";
import SocialCircle from "./pages/SocialCircle";
import Sidebar from "./components/Sidebar";
import FloatingMentor from "./components/FloatingMentor";
import LocationRadar from "./pages/LocationRadar";
import GeoNotification from "./components/GeoNotification";
import TechnicalArchitecture from './components/TechnicalArchitecture';
import ScalabilityFuture from './components/ScalabilityFuture';
import BusinessModel from './components/BusinessModel';
import "./App.css";

// Wrapper to handle layout based on route
function AppLayout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/" || location.pathname === "/checkout-demo";

  return (
    <div className={`app-wrapper ${hideSidebar ? 'no-sidebar' : ''}`}>
      <Sidebar />
      <FloatingMentor />
      <GeoNotification />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/allocator" element={<Allocator />} />
          <Route path="/checkout-demo" element={<CheckoutDemo />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/chat" element={<ChatAssistant />} />
          <Route path="/social" element={<SocialCircle />} />
          <Route path="/location" element={<LocationRadar />} />
          <Route path="/architecture" element={<TechnicalArchitecture />} />
          <Route path="/scalability" element={<ScalabilityFuture />} />
          <Route path="/business" element={<BusinessModel />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
