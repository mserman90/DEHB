import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Target, Trophy, Flame, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import GamificationWidget from "@/components/GamificationWidget";
import FocusAudio from "@/components/FocusAudio";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/achievements`)
      ]);
      
      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-dashboard">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Bugünkü Görevler",
      value: `${stats?.completed_tasks || 0}/${stats?.today_tasks || 0}`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      testId: "today-tasks-stat"
    },
    {
      title: "Pomodoro Seansları",
      value: stats?.today_pomodoros || 0,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      testId: "today-pomodoros-stat"
    },
    {
      title: "Çalışma Süresi",
      value: `${stats?.today_study_minutes || 0} dk`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      testId: "today-study-time-stat"
    },
    {
      title: "Çözülen Soru",
      value: stats?.today_questions || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      testId: "today-questions-stat"
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2" data-testid="dashboard-title">
          Hoş Geldin! 👋
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Bugün harika bir gün olacak. Hadi başlayalım!
        </p>
      </div>

      {/* Gamification Widget */}
      <div className="mb-6">
        <GamificationWidget />
      </div>

      {/* Streak Card */}
      {stats?.current_streak > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" data-testid="streak-card">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <Flame className="w-12 h-12" />
              <div>
                <h3 className="text-2xl font-bold" data-testid="streak-value">{stats.current_streak} Gün</h3>
                <p className="text-orange-100">Çalışma Serisi Devam Ediyor!</p>
              </div>
            </div>
            <Trophy className="w-16 h-16 opacity-50" />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow" data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-full flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Focus Audio Widget */}
      <div className="mb-8">
        <FocusAudio />
      </div>

      {/* Achievements */}
      <Card className="mb-8" data-testid="achievements-section">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Başarılarım</span>
            <span className="text-sm font-normal text-gray-500">({achievements.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="no-achievements">Henüz başarı kazanmadın. Çalışmaya başla!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  data-testid={`achievement-${achievement.badge_type}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          className="h-20 text-lg bg-teal-600 hover:bg-teal-700"
          onClick={() => window.location.href = '/pomodoro'}
          data-testid="quick-action-pomodoro"
        >
          <Clock className="w-6 h-6 mr-2" />
          Pomodoro Başlat
        </Button>
        <Button
          size="lg"
          className="h-20 text-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/tasks'}
          data-testid="quick-action-tasks"
        >
          <CheckCircle2 className="w-6 h-6 mr-2" />
          Görev Ekle
        </Button>
        <Button
          size="lg"
          className="h-20 text-lg bg-purple-600 hover:bg-purple-700"
          onClick={() => window.location.href = '/subjects'}
          data-testid="quick-action-subjects"
        >
          <Target className="w-6 h-6 mr-2" />
          Soru Çöz
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
