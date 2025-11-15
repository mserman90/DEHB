import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

const FocusAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [currentSound, setCurrentSound] = useState('whitenoise');
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    // Initialize Web Audio API
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume[0] / 100;
    }
  }, [volume]);

  const startWhiteNoise = () => {
    const audioContext = audioContextRef.current;
    const bufferSize = 4096;
    const whiteNoise = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    whiteNoise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    };
    
    whiteNoise.connect(gainNodeRef.current);
    oscillatorRef.current = whiteNoise;
  };

  const startRain = () => {
    const audioContext = audioContextRef.current;
    const bufferSize = 4096;
    const rainNoise = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    rainNoise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5; // Softer than white noise
      }
    };
    
    rainNoise.connect(gainNodeRef.current);
    oscillatorRef.current = rainNoise;
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (oscillatorRef.current) {
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (currentSound === 'whitenoise') {
        startWhiteNoise();
      } else if (currentSound === 'rain') {
        startRain();
      }
      
      setIsPlaying(true);
    }
  };

  const changeSound = (sound) => {
    if (isPlaying) {
      if (oscillatorRef.current) {
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      
      if (sound === 'whitenoise') {
        startWhiteNoise();
      } else if (sound === 'rain') {
        startRain();
      }
    }
    setCurrentSound(sound);
  };

  const sounds = [
    { id: 'whitenoise', name: 'Beyaz Gürültü', icon: '🌫️' },
    { id: 'rain', name: 'Yağmur Sesi', icon: '🌧️' }
  ];

  return (
    <Card data-testid="focus-audio-widget">
      <CardHeader>
        <CardTitle className="text-lg">Odak Sesleri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {sounds.map((sound) => (
            <Button
              key={sound.id}
              variant={currentSound === sound.id ? "default" : "outline"}
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => changeSound(sound.id)}
              data-testid={`sound-${sound.id}`}
            >
              <span className="text-2xl mb-1">{sound.icon}</span>
              <span className="text-xs">{sound.name}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            data-testid="audio-play-pause"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <div className="flex-1 flex items-center space-x-2">
            {volume[0] === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="flex-1"
              data-testid="volume-slider"
            />
            <span className="text-sm text-gray-600 w-8">{volume[0]}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusAudio;