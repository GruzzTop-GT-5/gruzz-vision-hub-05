import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, DollarSign, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  created_at: string;
  user_id: string;
  status: string;
}

interface AdDetailsModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdDetailsModal({ ad, isOpen, onClose }: AdDetailsModalProps) {
  const [adDetails, setAdDetails] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ad && isOpen) {
      setAdDetails(ad);
    }
  }, [ad, isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-steel-600/10 text-steel-400 border-steel-600/20';
    }
  };

  if (!adDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold text-steel-100 pr-4">
              {adDetails.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-steel-400 hover:text-steel-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(adDetails.status)}>
              {adDetails.status === 'active' ? 'Активно' : adDetails.status}
            </Badge>
            <div className="flex items-center space-x-2 text-sm text-steel-400">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(adDetails.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </span>
            </div>
          </div>

          <Separator className="bg-steel-600" />

          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold text-steel-200 mb-2">Категория</h3>
            <Badge variant="outline" className="text-steel-300">
              {adDetails.category}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-steel-200 mb-2">Описание</h3>
            <p className="text-steel-300 leading-relaxed whitespace-pre-wrap">
              {adDetails.description}
            </p>
          </div>

          {/* Price */}
          <div>
            <h3 className="text-sm font-semibold text-steel-200 mb-2">Стоимость</h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {formatPrice(adDetails.price)} GT
              </span>
            </div>
          </div>

          <Separator className="bg-steel-600" />

          {/* Author Info */}
          <div>
            <h3 className="text-sm font-semibold text-steel-200 mb-2">Автор объявления</h3>
            <div className="flex items-center justify-between">
              <Link 
                to={`/profile/${adDetails.user_id}`}
                className="flex items-center space-x-2 text-steel-300 hover:text-primary transition-colors"
                onClick={onClose}
              >
                <User className="w-4 h-4" />
                <span>ID: {adDetails.user_id.slice(0, 8)}...</span>
              </Link>
              <Button 
                className="bg-primary hover:bg-primary/80"
                onClick={onClose}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Связаться
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/80"
              onClick={onClose}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Написать автору
            </Button>
            <Link 
              to={`/ad/${adDetails.id}`}
              className="flex-1"
              onClick={onClose}
            >
              <Button variant="outline" className="w-full">
                Полная страница
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}