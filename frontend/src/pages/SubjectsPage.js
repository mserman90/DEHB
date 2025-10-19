import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const SubjectsPage = () => {
  const [summary, setSummary] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStats, setNewStats] = useState({
    subject: "",
    questions_solved: 0,
    correct_answers: 0,
    time_spent_minutes: 0,
    date: new Date().toISOString().split('T')[0]
  });

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
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/study-stats/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    }
  };

  const handleAddStats = async () => {
    if (!newStats.subject || newStats.questions_solved <= 0) {
      toast.error("Lütfen konu seçin ve soru sayısı girin");
      return;
    }

    if (newStats.correct_answers > newStats.questions_solved) {
      toast.error("Doğru cevap sayısı toplam sorudan fazla olamaz");
      return;
    }

    try {
      await axios.post(`${API}/study-stats`, newStats);
      toast.success("Çalışma kaydedildi! 📚");
      setIsDialogOpen(false);
      setNewStats({
        subject: "",
        questions_solved: 0,
        correct_answers: 0,
        time_spent_minutes: 0,
        date: new Date().toISOString().split('T')[0]
      });
      fetchSummary();
    } catch (error) {
      console.error("Error adding stats:", error);
      toast.error("Kayıt eklenemedi");
    }
  };

  const getSubjectColor = (index) => {
    const colors = [
      "bg-blue-50 border-blue-200",
      "bg-green-50 border-green-200",
      "bg-purple-50 border-purple-200",
      "bg-orange-50 border-orange-200",
      "bg-pink-50 border-pink-200",
      "bg-teal-50 border-teal-200",
      "bg-indigo-50 border-indigo-200",
      "bg-yellow-50 border-yellow-200",
      "bg-red-50 border-red-200",
      "bg-cyan-50 border-cyan-200",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="subjects-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800" data-testid="subjects-title">
          Konu Takibi
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700" data-testid="add-study-button">
              <Plus className="w-5 h-5 mr-2" />
              Çalışma Ekle
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-study-dialog">
            <DialogHeader>
              <DialogTitle>Soru Çözme Kaydı Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Konu *</label>
                <Select
                  value={newStats.subject}
                  onValueChange={(value) => setNewStats({ ...newStats, subject: value })}
                >
                  <SelectTrigger data-testid="study-subject-select">
                    <SelectValue placeholder="Konu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Çözülen Soru *</label>
                  <Input
                    type="number"
                    value={newStats.questions_solved}
                    onChange={(e) => setNewStats({ ...newStats, questions_solved: parseInt(e.target.value) || 0 })}
                    min="0"
                    data-testid="questions-solved-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Doğru Sayısı *</label>
                  <Input
                    type="number"
                    value={newStats.correct_answers}
                    onChange={(e) => setNewStats({ ...newStats, correct_answers: parseInt(e.target.value) || 0 })}
                    min="0"
                    data-testid="correct-answers-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Çalışma Süresi (dakika)</label>
                <Input
                  type="number"
                  value={newStats.time_spent_minutes}
                  onChange={(e) => setNewStats({ ...newStats, time_spent_minutes: parseInt(e.target.value) || 0 })}
                  min="0"
                  step="5"
                  data-testid="time-spent-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <Input
                  type="date"
                  value={newStats.date}
                  onChange={(e) => setNewStats({ ...newStats, date: e.target.value })}
                  data-testid="study-date-input"
                />
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleAddStats}
                data-testid="save-study-button"
              >
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary.length === 0 ? (
        <Card data-testid="no-subjects-message">
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">Henüz çalışma kaydın yok. Hemen başla!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {summary.map((stat, index) => (
            <Card
              key={stat.subject}
              className={`border-2 transition-all hover:shadow-lg ${getSubjectColor(index)}`}
              data-testid={`subject-card-${stat.subject}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl" data-testid={`subject-name-${stat.subject}`}>📚 {stat.subject}</span>
                  <span
                    className={`text-2xl font-bold ${
                      stat.accuracy >= 80
                        ? "text-green-600"
                        : stat.accuracy >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                    data-testid={`subject-accuracy-${stat.subject}`}
                  >
                    %{stat.accuracy}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Toplam Soru
                    </span>
                    <span className="font-semibold text-gray-800" data-testid={`subject-total-questions-${stat.subject}`}>
                      {stat.total_questions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Doğru
                    </span>
                    <span className="font-semibold text-green-600" data-testid={`subject-correct-${stat.subject}`}>
                      {stat.total_correct}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Yanlış
                    </span>
                    <span className="font-semibold text-red-600" data-testid={`subject-wrong-${stat.subject}`}>
                      {stat.total_questions - stat.total_correct}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">⏱️ Toplam Süre</span>
                      <span className="font-semibold text-gray-800" data-testid={`subject-time-${stat.subject}`}>
                        {Math.floor(stat.total_time_minutes / 60)}s {stat.total_time_minutes % 60}dk
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
