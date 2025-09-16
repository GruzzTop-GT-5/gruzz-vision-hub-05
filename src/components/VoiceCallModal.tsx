import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings
} from 'lucide-react';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAvatar?: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const VoiceCallModal = ({ 
  isOpen, 
  onClose, 
  recipientName, 
  recipientAvatar,
  isIncoming = false,
  onAccept,
  onDecline 
}: VoiceCallModalProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isConnected && callStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected, callStatus]);

  useEffect(() => {
    if (!isOpen) {
      setIsConnected(false);
      setDuration(0);
      setCallStatus('ringing');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    setCallStatus('connecting');
    onAccept?.();
    
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
      setCallStatus('connected');
      toast({
        title: "Звонок подключен",
        description: `Вы в эфире с ${recipientName}`,
      });
    }, 2000);
  };

  const handleDecline = () => {
    setCallStatus('ended');
    onDecline?.();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setIsConnected(false);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Микрофон включен" : "Микрофон выключен",
    });
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast({
      title: isSpeakerOn ? "Динамик выключен" : "Динамик включен",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel max-w-sm p-0 border-none data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <div className="relative overflow-hidden rounded-lg">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-steel-800 to-steel-900" />
          
          <div className="relative p-8 text-center space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-white/20">
                  <AvatarImage src={recipientAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-steel-900 text-2xl font-bold">
                    {recipientName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                {callStatus === 'connected' && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
            </div>

            {/* Name and Status */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-steel-100">{recipientName}</h2>
              <div className="text-steel-300">
                {callStatus === 'ringing' && !isIncoming && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span>Вызов...</span>
                  </div>
                )}
                {callStatus === 'ringing' && isIncoming && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                    <span>Входящий звонок</span>
                  </div>
                )}
                {callStatus === 'connecting' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span>Подключение...</span>
                  </div>
                )}
                {callStatus === 'connected' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{formatDuration(duration)}</span>
                  </div>
                )}
                {callStatus === 'ended' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Звонок завершен</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {(callStatus === 'connecting' || callStatus === 'connected') && (
                <div className="flex justify-center space-x-4">
                  <Button
                    size="lg"
                    variant={isMuted ? "destructive" : "secondary"}
                    onClick={toggleMute}
                    className="w-12 h-12 rounded-full"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant={isSpeakerOn ? "default" : "secondary"}
                    onClick={toggleSpeaker}
                    className="w-12 h-12 rounded-full"
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-12 h-12 rounded-full"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Call Actions */}
              <div className="flex justify-center space-x-4">
                {isIncoming && callStatus === 'ringing' ? (
                  <>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleDecline}
                      className="w-14 h-14 rounded-full"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </Button>
                    <Button
                      size="lg"
                      className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700"
                      onClick={handleAccept}
                    >
                      <Phone className="w-6 h-6" />
                    </Button>
                  </>
                ) : callStatus === 'ended' ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onClose}
                    className="px-8"
                  >
                    Закрыть
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={callStatus === 'ringing' ? handleDecline : handleEndCall}
                    className="w-14 h-14 rounded-full"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};