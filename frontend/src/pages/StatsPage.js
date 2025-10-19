import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { toast } from "sonner";

const StatsPage = () => {
  const [pomodoroStats, setPomodoroStats] = useState({ total_sessions: 0, total_work_minutes: 0, sessions: [] });
  const [studyStats, setStudyStats] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      const [pomodoroRes, studyRes, summaryRes] = await Promise.all([
        axios.get(`${API}/pomodoro/stats`),
        axios.get(`${API}/study-stats`),
        axios.get(`${API}/study-stats/summary`)
      ]);
      
      setPomodoroStats(pomodoroRes.data);
      setStudyStats(studyRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-stats">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  const totalQuestions = summary.reduce((acc, s) => acc + s.total_questions, 0);
  const totalCorrect = summary.reduce((acc, s) => acc + s.total_correct, 0);
  const totalStudyTime = summary.reduce((acc, s) => acc + s.total_time_minutes, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="stats-page">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8" data-testid="stats-title">
        İstatistiklerim
      </h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="total-pomodoros-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Toplam Pomodoro</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="total-pomodoros-value">{pomodoroStats.total_sessions}</p>
            <p className="text-xs text-gray-500 mt-1">{pomodoroStats.total_work_minutes} dakika</p>
          </CardContent>
        </Card>

        <Card data-testid="total-questions-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Çözülen Soru</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="total-questions-value">{totalQuestions}</p>
            <p className="text-xs text-gray-500 mt-1">{totalCorrect} doğru</p>
          </CardContent>
        </Card>

        <Card data-testid="overall-accuracy-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Genel Başarı</p>
            <p className="text-3xl font-bold text-green-600" data-testid="overall-accuracy-value">%{overallAccuracy}</p>
          </CardContent>
        </Card>

        <Card data-testid="total-study-time-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Toplam Çalışma</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="total-study-time-value">
              {Math.floor(totalStudyTime / 60)}<span className="text-xl">s</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{totalStudyTime % 60} dakika</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="mb-8" data-testid="subject-performance-section">
        <CardHeader>
          <CardTitle>Konu Bazlı Performans</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="no-subject-stats">Henüz konu bazlı veri yok</p>
          ) : (
            <div className="space-y-4">
              {summary.map((stat) => (
                <div key={stat.subject} className="border-b pb-4 last:border-b-0" data-testid={`subject-stat-${stat.subject}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800" data-testid={`subject-stat-name-${stat.subject}`}>{stat.subject}</h3>
                    <span
                      className={`text-lg font-bold ${
                        stat.accuracy >= 80
                          ? "text-green-600"
                          : stat.accuracy >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                      data-testid={`subject-stat-accuracy-${stat.subject}`}
                    >
                      %{stat.accuracy}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span data-testid={`subject-stat-questions-${stat.subject}`}>{stat.total_questions} soru</span>
                    <span data-testid={`subject-stat-correct-${stat.subject}`}>{stat.total_correct} doğru / {stat.total_questions - stat.total_correct} yanlış</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stat.accuracy >= 80
                          ? "bg-green-500"
                          : stat.accuracy >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${stat.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Study Sessions */}
      <Card data-testid="recent-sessions-section">
        <CardHeader>
          <CardTitle>Son Çalışma Seansları</CardTitle>
        </CardHeader>
        <CardContent>
          {studyStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="no-recent-sessions">Henüz çalışma kaydı yok</p>
          ) : (
            <div className="space-y-3">
              {studyStats.slice(-10).reverse().map((session, index) => (
                <div
                  key={`${session.subject}-${session.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  data-testid={`recent-session-${index}`}
                >
                  <div>
                    <p className="font-medium text-gray-800" data-testid={`recent-session-subject-${index}`}>{session.subject}</p>
                    <p className="text-sm text-gray-500" data-testid={`recent-session-date-${index}`}>{session.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800" data-testid={`recent-session-score-${index}`}>
                      {session.correct_answers}/{session.questions_solved}
                    </p>
                    <p className="text-sm text-gray-500" data-testid={`recent-session-time-${index}`}>{session.time_spent_minutes} dk</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPage;
