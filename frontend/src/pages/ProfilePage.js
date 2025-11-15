import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Award, Bell, User, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import HeatMap from "@/components/HeatMap";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({
    daily_summary: true,
    task_reminders: true,
    break_reminders: true,
    achievement_alerts: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
      setSettings(response.data.notification_settings || settings);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Profil yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/profile/settings`, settings);
      toast.success("Ayarlar kaydedildi!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilemedi");
    }
  };

  const getCharacterEmoji = () => {
    if (!profile) return '🌱';
    switch (profile.character_type) {
      case 'seed': return '🌱';
      case 'sprout': return '🌿';
      case 'tree': return '🌳';
      case 'forest': return '🌲';
      default: return '🌱';
    }
  };

  const getCharacterTitle = () => {
    if (!profile) return 'Tohum';
    switch (profile.character_type) {
      case 'seed': return 'Tohum';
      case 'sprout': return 'Filiz';
      case 'tree': return 'Ağaç';
      case 'forest': return 'Orman';
      default: return 'Tohum';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-profile">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  const expToNextLevel = profile ? ((profile.level) * 100) - profile.experience : 0;
  const progressPercent = profile ? ((profile.experience % 100) / 100) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="profile-page">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8" data-testid="profile-title">
        Profilim
      </h1>

      {/* Character Card */}
      <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200" data-testid="character-card">
        <CardContent className="p-8">
          <div className="flex items-center space-x-6">
            <div className="text-8xl" data-testid="profile-character-emoji">{getCharacterEmoji()}</div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-purple-800 mb-2" data-testid="character-title">
                {getCharacterTitle()}
              </h2>
              <div className="flex items-center space-x-3 mb-3">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700" data-testid="profile-level">Seviye {profile?.level}</span>
              </div>
              <p className="text-purple-600 mb-3">Sonraki seviyeye {expToNextLevel} XP</p>
              
              <div className="mb-4">
                <div className="h-4 bg-purple-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${progressPercent}%` }}
                    data-testid="profile-exp-bar"
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-800" data-testid="profile-total-exp">{profile?.experience}</p>
                  <p className="text-sm text-purple-600">Toplam XP</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-800" data-testid="profile-trees">{profile?.trees_planted}</p>
                  <p className="text-sm text-green-600">Ağaç Sayısı</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-800" data-testid="profile-focus-time">{profile?.total_focus_minutes}</p>
                  <p className="text-sm text-blue-600">Odak Dakikası</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card className="mb-6" data-testid="activity-heatmap-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6" />
            <span>Çalışma Aktivitesi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HeatMap days={90} />
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card data-testid="notification-settings-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-6 h-6" />
            <span>Bildirim Ayarları</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Günlük Özet</p>
              <p className="text-sm text-gray-600">Her sabah günlük özet bildirimi</p>
            </div>
            <Switch
              checked={settings.daily_summary}
              onCheckedChange={(checked) => setSettings({...settings, daily_summary: checked})}
              data-testid="setting-daily-summary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Görev Hatırlatıcıları</p>
              <p className="text-sm text-gray-600">Tamamlanmamış görevler için hatırlatma</p>
            </div>
            <Switch
              checked={settings.task_reminders}
              onCheckedChange={(checked) => setSettings({...settings, task_reminders: checked})}
              data-testid="setting-task-reminders"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mola Hatırlatıcıları</p>
              <p className="text-sm text-gray-600">Mola zamanı bildirimi</p>
            </div>
            <Switch
              checked={settings.break_reminders}
              onCheckedChange={(checked) => setSettings({...settings, break_reminders: checked})}
              data-testid="setting-break-reminders"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Başarı Bildirimleri</p>
              <p className="text-sm text-gray-600">Yeni rozet kazandığında bildirim</p>
            </div>
            <Switch
              checked={settings.achievement_alerts}
              onCheckedChange={(checked) => setSettings({...settings, achievement_alerts: checked})}
              data-testid="setting-achievement-alerts"
            />
          </div>

          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={handleSaveSettings}
            data-testid="save-settings-button"
          >
            Ayarları Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;