import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    description: "",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 25,
    subtasks: []
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
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Görevler yüklenirken hata oluştu");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.subject) {
      toast.error("Lütfen başlık ve konu girin");
      return;
    }

    try {
      await axios.post(`${API}/tasks`, newTask);
      toast.success("Görev oluşturuldu!");
      setIsDialogOpen(false);
      setNewTask({
        title: "",
        subject: "",
        description: "",
        priority: "medium",
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 25
      });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Görev oluşturulamadı");
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { completed: !completed });
      fetchTasks();
      if (!completed) {
        toast.success("Görev tamamlandı! 🎉");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Görev güncellenemedi");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      toast.success("Görev silindi");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Görev silinemedi");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return "Orta";
    }
  };

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="tasks-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800" data-testid="tasks-title">
          Görevlerim
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700" data-testid="add-task-button">
              <Plus className="w-5 h-5 mr-2" />
              Görev Ekle
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-task-dialog">
            <DialogHeader>
              <DialogTitle>Yeni Görev Oluştur</DialogTitle>
              <DialogDescription>
                Çalışma programınız için yeni bir görev ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Başlık *</label>
                <Input
                  placeholder="Örn: Matematik testini çöz"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  data-testid="task-title-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Konu *</label>
                <Select
                  value={newTask.subject}
                  onValueChange={(value) => setNewTask({ ...newTask, subject: value })}
                >
                  <SelectTrigger data-testid="task-subject-select">
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
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <Textarea
                  placeholder="Görev detayları..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  data-testid="task-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Öncelik</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger data-testid="task-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tarih</label>
                  <Input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    data-testid="task-date-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tahmini Süre (dakika)</label>
                <Input
                  type="number"
                  value={newTask.duration_minutes}
                  onChange={(e) => setNewTask({ ...newTask, duration_minutes: parseInt(e.target.value) })}
                  min="5"
                  step="5"
                  data-testid="task-duration-input"
                />
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleCreateTask}
                data-testid="create-task-button"
              >
                Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      {sortedDates.length === 0 ? (
        <Card data-testid="no-tasks-message">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 text-lg">Henüz görev eklemedin. Hemen başla!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateTasks = groupedTasks[date];
            const completedCount = dateTasks.filter(t => t.completed).length;
            
            return (
              <div key={date}>
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-semibold text-gray-800" data-testid={`date-header-${date}`}>
                    {new Date(date).toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <span className="text-sm text-gray-500" data-testid={`date-progress-${date}`}>
                    ({completedCount}/{dateTasks.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {dateTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`transition-all hover:shadow-md ${
                        task.completed ? "opacity-60" : ""
                      }`}
                      data-testid={`task-card-${task.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                            className="mt-1"
                            data-testid={`task-checkbox-${task.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3
                                  className={`text-lg font-semibold ${
                                    task.completed ? "line-through text-gray-500" : "text-gray-800"
                                  }`}
                                  data-testid={`task-title-${task.id}`}
                                >
                                  {task.title}
                                </h3>
                                <p className="text-sm text-gray-600" data-testid={`task-subject-${task.id}`}>📚 {task.subject}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteTask(task.id)}
                                data-testid={`delete-task-${task.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2" data-testid={`task-description-${task.id}`}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}
                                data-testid={`task-priority-${task.id}`}
                              >
                                {getPriorityLabel(task.priority)}
                              </span>
                              <span className="text-xs text-gray-500" data-testid={`task-duration-${task.id}`}>
                                ⏱️ {task.duration_minutes} dk
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
