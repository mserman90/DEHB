import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import PomodoroPage from "@/pages/PomodoroPage";
import TasksPage from "@/pages/TasksPage";
import StatsPage from "@/pages/StatsPage";
import SubjectsPage from "@/pages/SubjectsPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import { Home, Timer, CheckSquare, BarChart3, BookOpen, User, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Ana Sayfa" },
    { path: "/pomodoro", icon: Timer, label: "Pomodoro" },
    { path: "/tasks", icon: CheckSquare, label: "Görevler" },
    { path: "/subjects", icon: BookOpen, label: "Konular" },
    { path: "/stats", icon: BarChart3, label: "İstatistikler" },
    { path: "/reports", icon: FileText, label: "Raporlar" },
    { path: "/profile", icon: User, label: "Profil" },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:bottom-auto md:border-b md:border-t-0 z-50" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around md:justify-start md:space-x-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-teal-600 bg-teal-50"
                    : "text-gray-600 hover:text-teal-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <div className="pt-0 pb-20 md:pt-16 md:pb-0 min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;
