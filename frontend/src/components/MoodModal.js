import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MoodModal = ({ isOpen, onClose, onSelectMood }) => {
  const moods = [
    { value: 'happy', emoji: '😊', label: 'Harika', color: 'bg-green-100 hover:bg-green-200' },
    { value: 'neutral', emoji: '😐', label: 'Normal', color: 'bg-yellow-100 hover:bg-yellow-200' },
    { value: 'tired', emoji: '😔', label: 'Yorgun', color: 'bg-red-100 hover:bg-red-200' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="mood-modal">
        <DialogHeader>
          <DialogTitle>Nasıl Hissediyorsun?</DialogTitle>
          <DialogDescription>
            Bu seans sonrası ruh halini kaydet
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              variant="outline"
              className={`h-24 flex flex-col items-center justify-center space-y-2 ${mood.color}`}
              onClick={() => onSelectMood(mood.value)}
              data-testid={`mood-${mood.value}`}
            >
              <span className="text-4xl">{mood.emoji}</span>
              <span className="text-sm font-medium">{mood.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodModal;