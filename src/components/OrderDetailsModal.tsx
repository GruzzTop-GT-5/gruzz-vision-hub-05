import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  Upload,
  Star,
  FileText,
  Download,
  Eye,
  History
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
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

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

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-steel-dialog max-w-4xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <DialogHeader>
          <DialogTitle className="text-steel-100 flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Заказ #{order.order_number}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
            <TabsTrigger value="chat">Чат</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card className="card-steel">
              <CardHeader>
                <CardTitle className="text-steel-100">{order.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.description && (
                  <div>
                    <Label className="text-steel-300">Описание</Label>
                    <p className="text-steel-200 mt-1">{order.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-steel-300">Цена</Label>
                    <p className="text-2xl font-bold text-primary">{order.price.toLocaleString('ru-RU')} GT</p>
                  </div>
                  
                  <div>
                    <Label className="text-steel-300">Категория</Label>
                    <p className="text-steel-200">{order.category || 'Без категории'}</p>
                  </div>

                  {order.deadline && (
                    <div>
                      <Label className="text-steel-300">Срок выполнения</Label>
                      <p className="text-steel-200">
                        {format(new Date(order.deadline), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-steel-300">Правки</Label>
                    <p className="text-steel-200">{order.revision_count} из {order.max_revisions}</p>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-steel-400" />
                    <span className="text-sm text-steel-300">Клиент:</span>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={clientProfile?.avatar_url} />
                      <AvatarFallback>
                        {(clientProfile?.display_name || clientProfile?.full_name || 'K').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-steel-100">
                      {clientProfile?.display_name || clientProfile?.full_name || 'Клиент'}
                    </span>
                  </div>

                  {order.executor_id && executorProfile && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-steel-400" />
                      <span className="text-sm text-steel-300">Исполнитель:</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={executorProfile?.avatar_url} />
                        <AvatarFallback>
                          {(executorProfile?.display_name || executorProfile?.full_name || 'И').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-steel-100">
                        {executorProfile?.display_name || executorProfile?.full_name || 'Исполнитель'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Requirements & Proposal */}
                {order.client_requirements && (
                  <div>
                    <Label className="text-steel-300">Требования клиента</Label>
                    <Card className="card-steel mt-1">
                      <CardContent className="p-3 space-y-3">
                        {typeof order.client_requirements === 'object' ? (
                          <>
                            {order.client_requirements.location && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Адрес объекта:</p>
                                <p className="text-steel-200">{order.client_requirements.location}</p>
                              </div>
                            )}
                            {order.client_requirements.specifications && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Требования к работникам:</p>
                                <p className="text-steel-200">{order.client_requirements.specifications}</p>
                              </div>
                            )}
                            {order.client_requirements.additional_notes && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Условия работы:</p>
                                <p className="text-steel-200">{order.client_requirements.additional_notes}</p>
                              </div>
                            )}
                            {order.client_requirements.people_count && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Количество рабочих:</p>
                                <p className="text-steel-200">{order.client_requirements.people_count} человек</p>
                              </div>
                            )}
                            {order.client_requirements.payment_type && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Тип оплаты:</p>
                                <p className="text-steel-200">
                                  {order.client_requirements.payment_type === 'hourly' && 'Почасовая оплата'}
                                  {order.client_requirements.payment_type === 'daily' && 'Дневная оплата'}
                                  {order.client_requirements.payment_type === 'project' && 'За весь объем работ'}
                                </p>
                              </div>
                            )}
                            {order.client_requirements.work_duration && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Продолжительность:</p>
                                <p className="text-steel-200">{order.client_requirements.work_duration}</p>
                              </div>
                            )}
                            {order.client_requirements.preferred_communication && (
                              <div>
                                <p className="text-sm font-medium text-steel-300">Предпочтительная связь:</p>
                                <p className="text-steel-200">{order.client_requirements.preferred_communication}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-steel-200">{order.client_requirements}</p>
                        )}
                      </CardContent>
                    </Card>
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
              </CardContent>
            </Card>
          </TabsContent>

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
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-1" />
                              Просмотр
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download={file.file_name}>
                              <Download className="w-4 h-4 mr-1" />
                              Скачать
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

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

          <TabsContent value="chat" className="space-y-4">
            <Card className="card-steel">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-steel-500 mx-auto mb-2" />
                <p className="text-steel-300 mb-4">Чат по заказу</p>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Открыть чат
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};