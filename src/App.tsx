import "./App.css";
import Index from "./pages/Landing/Index";
import ChatPage from "./pages/ChatPage/ChatPage";
import { ToastProvider } from "./helper/Toast";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HackathonShowcase from "./components/HackathonShowcase";
import ProjectGallery from "./components/ProjectGallery";
import IndividualPost from "./components/HackathonPost";
import UserDashboard from "./components/UserDashboard";
import HackathonOverComponent from "./pages/HackathonCompletionPage";
import Hackathon from "./pages/Hackathon";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chatPage/:projectId" element={<ChatPage />} />
            <Route path="/hackathon" element={<HackathonShowcase />} />

            {/* <Route path="/hackathon" element={<HackathonOverComponent/>} /> */}
            <Route path="/submit" element={<HackathonShowcase />} />
            <Route path="/gallery" element={<ProjectGallery />} />
            <Route path="/project/:id" element={<IndividualPost />} />
            <Route path="/dashboard" element={<UserDashboard />} />

          {/* Not Found */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </>
  );
}

export default App;
