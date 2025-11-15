import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { toast } from "sonner";
import MoodModal from "@/components/MoodModal";

const PomodoroPage = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState("work"); // work or break
  const [selectedSubject, setSelectedSubject] = useState("");
  const [stats, setStats] = useState({ total_sessions: 0, total_work_minutes: 0 });
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const subjects = [
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Türkçe",
    "Tarih",
    "Coğrafya",
    "Felsefe",
    "İngilizce",
    "Geometri"
  ];

  useEffect(() => {
    fetchStats();
    // Create audio element for notification
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSx9y/DZiTYHF2K36+qfVBILTKXh78hmKAoob8Xuv3UhBzKFz+/SmzQVFWS56+eqWxQNUrDk77RgJQY2jNLw0XgoCD2F0Oy6ay4PKW/A6+mrWxQOS6fi8MBmKQk3hMrvzXoqCzSC0O+9cy8NMH3H7s1+LwwsftDwxnUrDSx7y+7IfjkPKnW86ORyIgcvfcXuyHgwDSl4x+3FejIMMHvG78R9MQ0oeMrs');
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/pomodoro/stats?date=${today}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching pomodoro stats:", error);
    }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    if (sessionType === "work") {
      // Save work session
      try {
        const today = new Date().toISOString().split('T')[0];
        await axios.post(`${API}/pomodoro`, {
          duration_minutes: 25,
          session_type: "work",
          subject: selectedSubject || null,
          date: today
        });
        
        toast.success("🎉 Harika! 25 dakikalık çalışma tamamlandı!");
        fetchStats();
        
        // Start break
        setSessionType("break");
        setTimeLeft(5 * 60);
        toast.info("☕ 5 dakika mola zamanı!");
      } catch (error) {
        console.error("Error saving pomodoro session:", error);
        toast.error("Seans kaydedilemedi");
      }
    } else {
      // Break completed
      toast.success("Mola tamamlandı! Tekrar çalışmaya hazır mısın?");
      setSessionType("work");
      setTimeLeft(25 * 60);
    }
  };

  const handleStart = () => {
    if (sessionType === "work" && !selectedSubject) {
      toast.error("Lütfen bir konu seçin");
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionType === "work" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = sessionType === "work" 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="pomodoro-page">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center" data-testid="pomodoro-title">
        Pomodoro Timer
      </h1>

      {/* Timer Card */}
      <Card className="mb-8 overflow-hidden" data-testid="pomodoro-timer-card">
        <div className={`h-2 transition-all ${
          sessionType === "work" ? "bg-teal-500" : "bg-orange-500"
        }`} style={{ width: `${progress}%` }}></div>
        <CardContent className="p-8">
          {/* Session Type Badge */}
          <div className="flex justify-center mb-6">
            <div className={`px-6 py-2 rounded-full text-white font-semibold flex items-center space-x-2 ${
              sessionType === "work" ? "bg-teal-600" : "bg-orange-600"
            }`} data-testid="session-type-badge">
              {sessionType === "work" ? (
                <><Play className="w-4 h-4" /> <span>Çalışma Seansı</span></>
              ) : (
                <><Coffee className="w-4 h-4" /> <span>Mola</span></>
              )}
            </div>
          </div>

          {/* Subject Selection (only for work sessions) */}
          {sessionType === "work" && !isRunning && (
            <div className="mb-6 max-w-xs mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Konu Seçin</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="subject-select">
                  <SelectValue placeholder="Konu seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject} data-testid={`subject-option-${subject}`}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={`text-8xl md:text-9xl font-bold mb-4 ${
              sessionType === "work" ? "text-teal-600" : "text-orange-600"
            }`} data-testid="timer-display">
              {formatTime(timeLeft)}
            </div>
            {sessionType === "work" && selectedSubject && (
              <p className="text-lg text-gray-600" data-testid="selected-subject">📚 {selectedSubject}</p>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <Button
                size="lg"
                className="h-16 px-8 text-lg bg-teal-600 hover:bg-teal-700"
                onClick={handleStart}
                data-testid="start-button"
              >
                <Play className="w-6 h-6 mr-2" />
                Başlat
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-16 px-8 text-lg bg-orange-600 hover:bg-orange-700"
                onClick={handlePause}
                data-testid="pause-button"
              >
                <Pause className="w-6 h-6 mr-2" />
                Duraklat
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="h-16 px-8 text-lg"
              onClick={handleReset}
              data-testid="reset-button"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Sıfırla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card data-testid="today-sessions-card">
          <CardHeader>
            <CardTitle className="text-lg">Bugünkü Seanslar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-teal-600" data-testid="today-sessions-count">{stats.total_sessions}</p>
          </CardContent>
        </Card>
        <Card data-testid="today-study-time-card">
          <CardHeader>
            <CardTitle className="text-lg">Toplam Süre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600" data-testid="today-study-time-value">{stats.total_work_minutes} dk</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PomodoroPage;
