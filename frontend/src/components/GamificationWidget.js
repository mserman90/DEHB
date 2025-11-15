import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Award } from "lucide-react";

const GamificationWidget = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  if (!profile) return null;

  const getCharacterEmoji = () => {
    switch (profile.character_type) {
      case 'seed': return '🌱';
      case 'sprout': return '🌿';
      case 'tree': return '🌳';
      case 'forest': return '🌲🌲🌲';
      default: return '🌱';
    }
  };

  const expToNextLevel = ((profile.level) * 100) - profile.experience;
  const progressPercent = ((profile.experience % 100) / 100) * 100;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200" data-testid="gamification-widget">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-800" data-testid="user-level">Seviye {profile.level}</span>
            </div>
            <p className="text-sm text-purple-600">Sonraki seviyeye {expToNextLevel} XP</p>
          </div>
          <div className="text-5xl" data-testid="character-emoji">{getCharacterEmoji()}</div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 bg-purple-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              data-testid="exp-progress-bar"
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-800" data-testid="total-exp">{profile.experience}</p>
            <p className="text-xs text-purple-600">XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-800" data-testid="trees-planted">{profile.trees_planted}</p>
            <p className="text-xs text-green-600">Ağaç</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-800" data-testid="focus-minutes">{profile.total_focus_minutes}</p>
            <p className="text-xs text-blue-600">Dakika</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationWidget;