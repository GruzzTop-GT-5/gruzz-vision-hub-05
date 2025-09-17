import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'keyword' | 'pattern' | 'length' | 'spam' | 'profanity';
  content_types: string[];
  conditions: {
    keywords?: string[];
    patterns?: string[];
    min_length?: number;
    max_length?: number;
    threshold?: number;
    case_sensitive?: boolean;
  };
  actions: {
    action_type: 'flag' | 'reject' | 'require_review' | 'auto_approve';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    notification?: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AutoModerationRules = () => {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'keyword' as ModerationRule['rule_type'],
    content_types: [] as string[],
    conditions: {
      keywords: [] as string[],
      patterns: [] as string[],
      min_length: 0,
      max_length: 1000,
      threshold: 5,
      case_sensitive: false
    },
    actions: {
      action_type: 'flag' as ModerationRule['actions']['action_type'],
      priority: 'normal' as ModerationRule['actions']['priority'],
      notification: true
    },
    is_active: true
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [patternInput, setPatternInput] = useState('');
  const { toast } = useToast();

  const ruleTypeLabels = {
    keyword: 'Ключевые слова',
    pattern: 'Регулярные выражения',
    length: 'Длина содержимого',
    spam: 'Спам-фильтр',
    profanity: 'Нецензурная лексика'
  };

  const contentTypeLabels = {
    ads: 'Объявления',
    reviews: 'Отзывы',
    messages: 'Сообщения',
    orders: 'Заказы'
  };

  const actionTypeLabels = {
    flag: 'Отметить для проверки',
    reject: 'Автоматически отклонить',
    require_review: 'Требует ручной проверки',
    auto_approve: 'Автоматически одобрить'
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moderation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching moderation rules:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить правила модерации",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'keyword',
      content_types: [],
      conditions: {
        keywords: [],
        patterns: [],
        min_length: 0,
        max_length: 1000,
        threshold: 5,
        case_sensitive: false
      },
      actions: {
        action_type: 'flag',
        priority: 'normal',
        notification: true
      },
      is_active: true
    });
    setEditingRule(null);
    setKeywordInput('');
    setPatternInput('');
  };

  const handleEdit = (rule: ModerationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      content_types: rule.content_types,
      conditions: rule.conditions,
      actions: rule.actions,
      is_active: rule.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Ошибка",
          description: "Название правила обязательно",
          variant: "destructive"
        });
        return;
      }

      if (formData.content_types.length === 0) {
        toast({
          title: "Ошибка",
          description: "Выберите хотя бы один тип контента",
          variant: "destructive"
        });
        return;
      }

      const ruleData = {
        name: formData.name,
        description: formData.description,
        rule_type: formData.rule_type,
        content_types: formData.content_types,
        conditions: formData.conditions,
        actions: formData.actions,
        is_active: formData.is_active
      };

      if (editingRule) {
        const { error } = await supabase
          .from('moderation_rules')
          .update({ ...ruleData, updated_at: new Date().toISOString() })
          .eq('id', editingRule.id);

        if (error) throw error;

        // Логируем изменение
        await supabase.from('admin_logs').insert({
          action: 'updated_moderation_rule',
          target_type: 'moderation_rule',
          target_id: editingRule.id
        });

        toast({
          title: "Успешно",
          description: "Правило модерации обновлено"
        });
      } else {
        const { error } = await supabase
          .from('moderation_rules')
          .insert(ruleData);

        if (error) throw error;

        // Логируем создание
        await supabase.from('admin_logs').insert({
          action: 'created_moderation_rule',
          target_type: 'moderation_rule'
        });

        toast({
          title: "Успешно",
          description: "Правило модерации создано"
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving moderation rule:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить правило модерации",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (rule: ModerationRule) => {
    try {
      const { error } = await supabase
        .from('moderation_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      // Логируем удаление
      await supabase.from('admin_logs').insert({
        action: 'deleted_moderation_rule',
        target_type: 'moderation_rule',
        target_id: rule.id
      });

      toast({
        title: "Успешно",
        description: "Правило модерации удалено"
      });

      fetchRules();
    } catch (error) {
      console.error('Error deleting moderation rule:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить правило модерации",
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (rule: ModerationRule) => {
    try {
      const { error } = await supabase
        .from('moderation_rules')
        .update({ 
          is_active: !rule.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id);

      if (error) throw error;

      // Логируем изменение статуса
      await supabase.from('admin_logs').insert({
        action: `${!rule.is_active ? 'activated' : 'deactivated'}_moderation_rule`,
        target_type: 'moderation_rule',
        target_id: rule.id
      });

      toast({
        title: "Успешно",
        description: `Правило ${!rule.is_active ? 'активировано' : 'деактивировано'}`
      });

      fetchRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус правила",
        variant: "destructive"
      });
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.conditions.keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          keywords: [...(prev.conditions.keywords || []), keywordInput.trim()]
        }
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        keywords: prev.conditions.keywords?.filter(k => k !== keyword) || []
      }
    }));
  };

  const addPattern = () => {
    if (patternInput.trim() && !formData.conditions.patterns?.includes(patternInput.trim())) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          patterns: [...(prev.conditions.patterns || []), patternInput.trim()]
        }
      }));
      setPatternInput('');
    }
  };

  const removePattern = (pattern: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        patterns: prev.conditions.patterns?.filter(p => p !== pattern) || []
      }
    }));
  };

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      content_types: prev.content_types.includes(type)
        ? prev.content_types.filter(t => t !== type)
        : [...prev.content_types, type]
    }));
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'flag': return 'secondary';
      case 'reject': return 'destructive';
      case 'require_review': return 'default';
      case 'auto_approve': return 'secondary';
      default: return 'secondary';
    }
  };

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    keywords: rules.filter(r => r.rule_type === 'keyword').length,
    patterns: rules.filter(r => r.rule_type === 'pattern').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Bot className="w-6 h-6 animate-pulse mr-2" />
          Загрузка правил автомодерации...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Всего правил</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ключевые слова</p>
                <p className="text-2xl font-bold">{stats.keywords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Паттерны</p>
                <p className="text-2xl font-bold">{stats.patterns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основная карточка */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Правила автоматической модерации
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать правило
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Редактировать правило' : 'Создать правило модерации'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Название правила</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Например: Блокировка спама"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Описание</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Описание правила..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Тип правила</label>
                    <Select
                      value={formData.rule_type}
                      onValueChange={(value: ModerationRule['rule_type']) => 
                        setFormData(prev => ({ ...prev, rule_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ruleTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Типы контента</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(contentTypeLabels).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.content_types.includes(key)}
                            onChange={() => toggleContentType(key)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Условия в зависимости от типа правила */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Условия</h4>
                    
                    {formData.rule_type === 'keyword' && (
                      <div>
                        <label className="text-sm font-medium">Ключевые слова</label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Добавить ключевое слово..."
                            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                          />
                          <Button type="button" onClick={addKeyword}>Добавить</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.conditions.keywords?.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword}
                              <button
                                onClick={() => removeKeyword(keyword)}
                                className="ml-2 text-xs hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <label className="flex items-center space-x-2 mt-2">
                          <input
                            type="checkbox"
                            checked={formData.conditions.case_sensitive}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              conditions: { ...prev.conditions, case_sensitive: e.target.checked }
                            }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Учитывать регистр</span>
                        </label>
                      </div>
                    )}
                    
                    {formData.rule_type === 'pattern' && (
                      <div>
                        <label className="text-sm font-medium">Регулярные выражения</label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={patternInput}
                            onChange={(e) => setPatternInput(e.target.value)}
                            placeholder="Добавить регулярное выражение..."
                            onKeyPress={(e) => e.key === 'Enter' && addPattern()}
                          />
                          <Button type="button" onClick={addPattern}>Добавить</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.conditions.patterns?.map((pattern) => (
                            <Badge key={pattern} variant="secondary">
                              {pattern}
                              <button
                                onClick={() => removePattern(pattern)}
                                className="ml-2 text-xs hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.rule_type === 'length' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Минимальная длина</label>
                          <Input
                            type="number"
                            value={formData.conditions.min_length}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              conditions: { ...prev.conditions, min_length: parseInt(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Максимальная длина</label>
                          <Input
                            type="number"
                            value={formData.conditions.max_length}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              conditions: { ...prev.conditions, max_length: parseInt(e.target.value) || 1000 }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Действия */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Действия</h4>
                    
                    <div>
                      <label className="text-sm font-medium">Действие при срабатывании</label>
                      <Select
                        value={formData.actions.action_type}
                        onValueChange={(value: ModerationRule['actions']['action_type']) =>
                          setFormData(prev => ({
                            ...prev,
                            actions: { ...prev.actions, action_type: value }
                          }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(actionTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Приоритет</label>
                      <Select
                        value={formData.actions.priority}
                        onValueChange={(value: ModerationRule['actions']['priority']) =>
                          setFormData(prev => ({
                            ...prev,
                            actions: { ...prev.actions, priority: value }
                          }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Низкий</SelectItem>
                          <SelectItem value="normal">Обычный</SelectItem>
                          <SelectItem value="high">Высокий</SelectItem>
                          <SelectItem value="urgent">Срочный</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.actions.notification}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          actions: { ...prev.actions, notification: e.target.checked }
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Отправлять уведомления</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <span className="text-sm">Активное правило</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingRule ? 'Сохранить' : 'Создать'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Нет правил автомодерации</p>
              <p className="text-sm">Создайте первое правило для автоматической модерации контента</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Активно' : 'Неактивно'}
                        </Badge>
                        <Badge variant="outline">
                          {ruleTypeLabels[rule.rule_type]}
                        </Badge>
                        <Badge variant={getActionColor(rule.actions.action_type)}>
                          {actionTypeLabels[rule.actions.action_type]}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Контент: {rule.content_types.map(type => contentTypeLabels[type as keyof typeof contentTypeLabels]).join(', ')}
                        </span>
                        <span>Приоритет: {rule.actions.priority}</span>
                      </div>
                      
                      {rule.rule_type === 'keyword' && rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rule.conditions.keywords.slice(0, 3).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {rule.conditions.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rule.conditions.keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRuleStatus(rule)}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить правило модерации</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить правило "{rule.name}"? Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(rule)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};