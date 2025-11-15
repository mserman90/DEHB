import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";

const HeatMap = ({ days = 90 }) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, [days]);

  const fetchHeatmapData = async () => {
    try {
      const response = await axios.get(`${API}/heatmap?days=${days}`);
      setHeatmapData(response.data);
    } catch (error) {
      console.error("Error fetching heatmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateArray = () => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getIntensity = (minutes) => {
    if (minutes === 0) return "bg-gray-100";
    if (minutes < 25) return "bg-green-200";
    if (minutes < 50) return "bg-green-300";
    if (minutes < 100) return "bg-green-400";
    return "bg-green-500";
  };

  const dates = getDateArray();
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  if (loading) {
    return <div className="text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-2" data-testid="heatmap-container">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">Son {days} gün</p>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Az</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <div className="w-3 h-3 bg-green-200 border border-gray-200 rounded"></div>
            <div className="w-3 h-3 bg-green-300 border border-gray-200 rounded"></div>
            <div className="w-3 h-3 bg-green-400 border border-gray-200 rounded"></div>
            <div className="w-3 h-3 bg-green-500 border border-gray-200 rounded"></div>
          </div>
          <span>Çok</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex space-x-1">
              {week.map((date) => {
                const minutes = heatmapData[date] || 0;
                return (
                  <div
                    key={date}
                    className={`w-3 h-3 rounded border border-gray-200 ${getIntensity(minutes)}`}
                    title={`${date}: ${minutes} dakika`}
                    data-testid={`heatmap-cell-${date}`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
