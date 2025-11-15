import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Award, Target } from "lucide-react";
import { toast } from "sonner";

const ReportsPage = () => {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyReport();
  }, []);

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/weekly`);
      setWeeklyReport(response.data);
    } catch (error) {
      console.error("Error fetching weekly report:", error);
      toast.error("Rapor yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-reports">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="reports-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2" data-testid="reports-title">
          Haftalık Rapor
        </h1>
        <p className="text-gray-600 flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{weeklyReport?.week_start} - {weeklyReport?.week_end}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="report-pomodoros-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pomodoro</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="report-pomodoros-value">{weeklyReport?.total_pomodoros}</p>
          </CardContent>
        </Card>

        <Card data-testid="report-questions-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Soru</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="report-questions-value">{weeklyReport?.total_questions}</p>
          </CardContent>
        </Card>

        <Card data-testid="report-accuracy-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Başarı</p>
            <p className="text-3xl font-bold text-green-600" data-testid="report-accuracy-value">%{weeklyReport?.accuracy}</p>
          </CardContent>
        </Card>

        <Card data-testid="report-time-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Çalışma</p>
            <p className="text-3xl font-bold text-gray-800" data-testid="report-time-value">{Math.floor((weeklyReport?.total_study_minutes || 0) / 60)}s</p>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Message */}
      <Card className="mb-8 bg-gradient-to-r from-teal-500 to-blue-500 text-white border-0" data-testid="motivation-card">
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold mb-2">Harika Gidiyorsun! 🎉</h3>
          <p className="text-teal-50">
            Bu hafta {weeklyReport?.total_pomodoros} çalışma seansı tamamladın ve {weeklyReport?.total_questions} soru çözdün. 
            Başarı oranın %{weeklyReport?.accuracy}! {weeklyReport?.new_achievements > 0 && `${weeklyReport.new_achievements} yeni rozet kazandın! 🏆`}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="tasks-stats-card">
          <CardHeader>
            <CardTitle>Tamamlanan Görevler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-6xl font-bold text-teal-600" data-testid="tasks-completed-value">{weeklyReport?.tasks_completed}</p>
              <p className="text-gray-600 mt-2">görev tamamlandı</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="achievements-stats-card">
          <CardHeader>
            <CardTitle>Yeni Başarılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-6xl font-bold text-yellow-600" data-testid="achievements-earned-value">{weeklyReport?.new_achievements}</p>
              <p className="text-gray-600 mt-2">rozet kazanıldı</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="mt-6" data-testid="performance-summary-card">
        <CardHeader>
          <CardTitle>Performans Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Doğru Cevaplar</span>
                <span className="font-semibold" data-testid="correct-answers-count">{weeklyReport?.total_correct} / {weeklyReport?.total_questions}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${weeklyReport?.accuracy}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Toplam Çalışma Süresi</span>
                <span className="font-semibold" data-testid="study-time-formatted">
                  {Math.floor((weeklyReport?.total_study_minutes || 0) / 60)} saat {(weeklyReport?.total_study_minutes || 0) % 60} dakika
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;