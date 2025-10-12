import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderBidsList } from '@/components/OrderBidsList';
import { UserProfileModal } from '@/components/UserProfileModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  Upload,
  Star,
  FileText,
  Download,
  Eye,
  History,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
  priority: string;
  deadline: string | null;
  client_id: string;
  executor_id: string | null;
  ad_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  payment_status: string;
  payment_method: string | null;
  client_requirements: any;
  executor_proposal: any;
  delivery_format: string | null;
  revision_count: number;
  max_revisions: number;
  escrow_amount: number | null;
  commission_rate: number;
  platform_fee: number | null;
  equipment_details?: any;
}

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  file_category: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

interface StatusHistory {
  id: string;
  status_from: string | null;
  status_to: string;
  reason: string | null;
  changed_by: string;
  created_at: string;
  metadata: any;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  clientProfile?: any;
  executorProfile?: any;
  onUpdate: () => void;
}

export const OrderDetailsModal = ({ 
  isOpen, 
  onClose, 
  order, 
  clientProfile, 
  executorProfile, 
  onUpdate 
}: OrderDetailsModalProps) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [showExecutorProfile, setShowExecutorProfile] = useState(false);

  const isClient = user?.id === order?.client_id;
  const isExecutor = user?.id === order?.executor_id;

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderFiles();
      fetchStatusHistory();
    }
  }, [isOpen, order]);

  const fetchOrderFiles = async () => {
    if (!order?.id) return;

    try {
      const { data, error } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching order files:', error);
    }
  };

  const fetchStatusHistory = async () => {
    if (!order?.id) return;

    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || !order || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${order.id}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('order-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('order-files')
          .getPublicUrl(fileName);

        // Save file record
        const { error: dbError } = await supabase
          .from('order_files')
          .insert({
            order_id: order.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type,
            file_category: 'deliverable',
            description: uploadDescription || null,
            uploaded_by: user!.id
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Файлы загружены",
        description: `Загружено файлов: ${selectedFiles.length}`
      });

      setSelectedFiles(null);
      setUploadDescription('');
      fetchOrderFiles();
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewFile = async (file: OrderFile) => {
    try {
      // Извлекаем путь к файлу из URL
      const urlParts = file.file_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'order-files');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from('order-files')
        .createSignedUrl(filePath, 3600); // 1 час

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть файл",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (file: OrderFile) => {
    try {
      // Извлекаем путь к файлу из URL
      const urlParts = file.file_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'order-files');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from('order-files')
        .createSignedUrl(filePath, 3600); // 1 час

      if (error) throw error;
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Ожидает',
      accepted: 'Принят',
      in_progress: 'В работе',
      review: 'На проверке',
      revision: 'Правки',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleOpenChat = async () => {
    if (!order || !user) return;

    // Determine the other participant
    const otherParticipantId = isClient ? order.executor_id : order.client_id;
    
    if (!otherParticipantId) {
      toast({
        title: "Ошибка",
        description: isClient 
          ? "Исполнитель еще не назначен на этот заказ" 
          : "Не удалось определить клиента заказа",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingChat(true);

    try {
      // Check if conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [user.id, otherParticipantId])
        .eq('type', 'chat')
        .limit(1);

      if (fetchError) throw fetchError;

      let conversationId: string;

      if (existingConversations && existingConversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            type: 'chat',
            title: `Чат по заказу #${order.order_number}`,
            participants: [user.id, otherParticipantId],
            created_by: user.id,
            status: 'active'
          })
          .select('id')
          .maybeSingle();

        if (createError) throw createError;
        if (!newConversation) {
          throw new Error('Failed to create conversation');
        }
        conversationId = newConversation.id;
      }

      // Navigate to chat
      navigate(`/chat-system?conversation=${conversationId}`);
      onClose();
      
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть чат",
        variant: "destructive"
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel-dialog max-w-4xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <DialogHeader>
          <DialogTitle className="text-steel-100 flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Заказ #{order.order_number}</span>
          </DialogTitle>
          <DialogDescription>
            Полная информация о заказе, файлы, откликах и истории изменений
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${
            isClient ? 5 : (isExecutor ? 3 : 2)
          }, minmax(0, 1fr))` }}>
            <TabsTrigger value="details">Детали</TabsTrigger>
            {(isClient || isExecutor) && <TabsTrigger value="files">Файлы</TabsTrigger>}
            {isClient && <TabsTrigger value="bids">Отклики</TabsTrigger>}
            {(isClient || isExecutor) && <TabsTrigger value="history">История</TabsTrigger>}
            <TabsTrigger value="chat">Чат</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card className="card-steel">
              <CardHeader>
                <CardTitle className="text-steel-100">{order.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Description */}
                {order.description && (
                  <div className="space-y-2">
                    <Label className="text-steel-300 text-base font-semibold">📝 Описание работы</Label>
                    <Card className="card-steel bg-steel-800/30">
                      <CardContent className="p-4">
                        <p className="text-steel-200 whitespace-pre-wrap leading-relaxed">{order.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Price, Category, Workers and Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-steel-300 text-sm">💰 Цена</Label>
                    <Card className="card-steel bg-steel-800/30">
                      <CardContent className="p-4">
                        <p className="text-2xl font-bold text-primary">{order.price.toLocaleString('ru-RU')} GT</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-steel-300 text-sm">📂 Категория</Label>
                    <Card className="card-steel bg-steel-800/30">
                      <CardContent className="p-4">
                        <p className="text-steel-200">{order.category || 'Без категории'}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {order.client_requirements?.people_needed && (
                    <div className="space-y-2">
                      <Label className="text-steel-300 text-sm">👥 Количество людей</Label>
                      <Card className="card-steel bg-steel-800/30">
                        <CardContent className="p-4">
                          <p className="text-2xl font-bold text-green-400">
                            {order.client_requirements.people_needed} {
                              order.client_requirements.people_needed === 1 ? 'человек' :
                              order.client_requirements.people_needed < 5 ? 'человека' : 'человек'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {order.client_requirements?.duration_hours && (
                    <div className="space-y-2">
                      <Label className="text-steel-300 text-sm">⏱️ Продолжительность</Label>
                      <Card className="card-steel bg-steel-800/30">
                        <CardContent className="p-4">
                          <p className="text-steel-200">
                            {order.client_requirements.duration_hours} {
                              order.client_requirements.duration_hours === 1 ? 'час' :
                              order.client_requirements.duration_hours < 5 ? 'часа' : 'часов'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Client Info - Clickable */}
                <div className="space-y-3">
                  <Label className="text-steel-300 text-base font-semibold">👤 Заказчик</Label>
                  
                  <Card 
                    className="card-steel bg-steel-800/30 cursor-pointer hover:bg-steel-800/50 transition-all" 
                    onClick={() => setShowClientProfile(true)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/30">
                            <AvatarImage src={clientProfile?.avatar_url || clientProfile?.telegram_photo_url} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {(clientProfile?.display_name || clientProfile?.full_name || 'К').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-steel-100 font-semibold text-lg">
                              {clientProfile?.display_name || clientProfile?.full_name || 'Заказчик'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 font-medium">
                                {clientProfile?.rating?.toFixed(2) || '5.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Button variant="outline" size="sm" className="text-xs">
                            Профиль
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Executor Info - если назначен */}
                {order.executor_id && executorProfile && (
                  <div className="space-y-3">
                    <Label className="text-steel-300 text-base font-semibold">⚙️ Исполнитель</Label>
                    
                    <Card 
                      className="card-steel bg-steel-800/30 cursor-pointer hover:bg-steel-800/50 transition-all" 
                      onClick={() => setShowExecutorProfile(true)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12 border-2 border-green-500/30">
                              <AvatarImage src={executorProfile?.avatar_url || executorProfile?.telegram_photo_url} />
                              <AvatarFallback className="bg-green-500/20 text-green-400">
                                {(executorProfile?.display_name || executorProfile?.full_name || 'И').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-steel-100 font-semibold text-lg">
                                {executorProfile?.display_name || executorProfile?.full_name || 'Исполнитель'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 font-medium">
                                  {executorProfile?.rating?.toFixed(2) || '5.00'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Button variant="outline" size="sm" className="text-xs">
                              Профиль
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Client Requirements - Structured */}
                {order.client_requirements && (
                  <div className="space-y-3">
                    <Label className="text-steel-300 text-base font-semibold">📋 Детали заказа</Label>
                    
                    {typeof order.client_requirements === 'object' ? (
                      <div className="space-y-3">
                        {/* Address */}
                        {order.client_requirements.location && (
                          <Card className="card-steel bg-steel-800/30">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">📍</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-steel-300 mb-1">Адрес объекта</p>
                                  <p className="text-steel-100 font-medium">{order.client_requirements.location}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Worker Requirements */}
                        {order.client_requirements.specifications && (
                          <Card className="card-steel bg-steel-800/30">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">👷</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-steel-300 mb-1">Требования к работникам</p>
                                  <p className="text-steel-200">{order.client_requirements.specifications}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Work Conditions */}
                        {order.client_requirements.additional_notes && (
                          <Card className="card-steel bg-steel-800/30">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">⚙️</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-steel-300 mb-1">Условия работы</p>
                                  <p className="text-steel-200">{order.client_requirements.additional_notes}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Additional Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {order.client_requirements.people_count && (
                            <Card className="card-steel bg-steel-800/30">
                              <CardContent className="p-3">
                                <p className="text-xs text-steel-400 mb-1">Количество рабочих</p>
                                <p className="text-steel-100 font-semibold">{order.client_requirements.people_count} чел.</p>
                              </CardContent>
                            </Card>
                          )}

                          {order.client_requirements.payment_type && (
                            <Card className="card-steel bg-steel-800/30">
                              <CardContent className="p-3">
                                <p className="text-xs text-steel-400 mb-1">Тип оплаты</p>
                                <p className="text-steel-100 font-semibold">
                                  {order.client_requirements.payment_type === 'hourly' && 'Почасовая'}
                                  {order.client_requirements.payment_type === 'daily' && 'Дневная'}
                                  {order.client_requirements.payment_type === 'project' && 'За весь объем'}
                                </p>
                              </CardContent>
                            </Card>
                          )}

                          {order.client_requirements.work_duration && (
                            <Card className="card-steel bg-steel-800/30">
                              <CardContent className="p-3">
                                <p className="text-xs text-steel-400 mb-1">Продолжительность</p>
                                <p className="text-steel-100 font-semibold">{order.client_requirements.work_duration}</p>
                              </CardContent>
                            </Card>
                          )}

                          {order.client_requirements.preferred_communication && (
                            <Card className="card-steel bg-steel-800/30">
                              <CardContent className="p-3">
                                <p className="text-xs text-steel-400 mb-1">Связь</p>
                                <p className="text-steel-100 font-semibold">{order.client_requirements.preferred_communication}</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Card className="card-steel bg-steel-800/30">
                        <CardContent className="p-4">
                          <p className="text-steel-200">{order.client_requirements}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {order.executor_proposal && (
                  <div>
                    <Label className="text-steel-300">Предложение исполнителя</Label>
                    <Card className="card-steel mt-1">
                      <CardContent className="p-3">
                        <pre className="text-steel-200 text-sm whitespace-pre-wrap">
                          {JSON.stringify(order.executor_proposal, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Equipment Details - Hidden from Executor */}
                {order.equipment_details && !isExecutor && (
                  <div>
                    <Label className="text-steel-300">🔧 Аренда компрессора</Label>
                    <Card className="card-steel mt-1">
                      <CardContent className="p-3 space-y-2">
                        {order.equipment_details.compressor && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-steel-400">Время:</span>
                              <span className="text-steel-200">{order.equipment_details.compressor.hours} ч</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-steel-400">Локация:</span>
                              <span className="text-steel-200">{order.equipment_details.compressor.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-steel-400">Оплата:</span>
                              <span className="text-steel-200">{order.equipment_details.compressor.paymentType}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span className="text-sm text-steel-300">Стоимость:</span>
                              <span className="text-primary">{order.equipment_details.compressor.price.toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab - Only for Client and Executor */}
          {(isClient || isExecutor) && (
          <TabsContent value="files" className="space-y-4">
            {/* File Upload */}
            {(isClient || isExecutor) && order.status !== 'completed' && order.status !== 'cancelled' && (
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100 flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Загрузить файлы</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Выберите файлы</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Описание (необязательно)</Label>
                    <Textarea
                      id="description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Краткое описание файлов..."
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleFileUpload}
                    disabled={!selectedFiles || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Загрузка...' : 'Загрузить файлы'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Files List */}
            <div className="space-y-2">
              {files.length === 0 ? (
                <Card className="card-steel">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                    <p className="text-steel-300">Файлы не загружены</p>
                  </CardContent>
                </Card>
              ) : (
                files.map((file) => (
                  <Card key={file.id} className="card-steel">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium text-steel-100">{file.file_name}</p>
                            <p className="text-sm text-steel-400">
                              {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </p>
                            {file.description && (
                              <p className="text-sm text-steel-300 mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewFile(file)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Просмотр
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Скачать
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          )}

          {/* Bids Tab - Only for Clients */}
          {isClient && (
            <TabsContent value="bids" className="space-y-4">
              <OrderBidsList 
                orderId={order.id} 
                onBidAccepted={() => {
                  onUpdate();
                  onClose();
                }}
              />
            </TabsContent>
          )}

          {/* History Tab - Only for Client and Executor */}
          {(isClient || isExecutor) && (
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-2">
              {statusHistory.length === 0 ? (
                <Card className="card-steel">
                  <CardContent className="p-8 text-center">
                    <History className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                    <p className="text-steel-300">История изменений пуста</p>
                  </CardContent>
                </Card>
              ) : (
                statusHistory.map((history) => (
                  <Card key={history.id} className="card-steel">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                          <History className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {history.status_from && (
                              <>
                                <Badge variant="outline">{getStatusLabel(history.status_from)}</Badge>
                                <span className="text-steel-400">→</span>
                              </>
                            )}
                            <Badge className="text-primary bg-primary/10 border-primary/20">
                              {getStatusLabel(history.status_to)}
                            </Badge>
                          </div>
                          
                          {history.reason && (
                            <p className="text-steel-300 mt-2">{history.reason}</p>
                          )}
                          
                          <p className="text-xs text-steel-400 mt-2">
                            {format(new Date(history.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          )}

          <TabsContent value="chat" className="space-y-4">
            <Card className="card-steel">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                <p className="text-steel-300 mb-4">Чат по заказу</p>
                {!order.executor_id && isClient ? (
                  <p className="text-steel-400 text-sm mb-4">
                    Чат будет доступен после назначения исполнителя
                  </p>
                ) : (
                  <Button 
                    onClick={handleOpenChat}
                    disabled={isCreatingChat}
                    className="bg-primary hover:bg-primary/80"
                  >
                    {isCreatingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Открыть чат
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Profile Modals */}
        <UserProfileModal
          userId={order?.client_id || null}
          open={showClientProfile}
          onOpenChange={setShowClientProfile}
        />
        
        <UserProfileModal
          userId={order?.executor_id || null}
          open={showExecutorProfile}
          onOpenChange={setShowExecutorProfile}
        />
      </DialogContent>
    </Dialog>
  );
};