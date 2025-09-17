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
import { useAuth } from '@/hooks/useAuth';

interface ModerationRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  content_types: string[];
  criteria: any;
  actions: any;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const AutoModerationRules = () => {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'keyword',
    content_types: [] as string[],
    criteria: {
      keywords: [] as string[],
      patterns: [] as string[],
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
    is_active: true,
    priority: 5
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [patternInput, setPatternInput] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

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
      criteria: {
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
      is_active: true,
      priority: 5
    });
    setEditingRule(null);
    setKeywordInput('');
    setPatternInput('');
  };

  const handleEdit = (rule: ModerationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      content_types: rule.content_types,
      criteria: rule.criteria || {
        keywords: [],
        patterns: [],
        min_length: 0,
        max_length: 1000,
        threshold: 5,
        case_sensitive: false
      },
      actions: rule.actions || {
        action_type: 'flag',
        priority: 'normal',
        notification: true
      },
      is_active: rule.is_active,
      priority: rule.priority
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
        criteria: formData.criteria,
        actions: formData.actions,
        is_active: formData.is_active,
        priority: formData.priority,
        created_by: user?.id
      };

      if (editingRule) {
        const { error } = await supabase
          .from('moderation_rules')
          .update({ ...ruleData, updated_at: new Date().toISOString() })
          .eq('id', editingRule.id);

        if (error) throw error;

        // Логируем изменение
        if (user?.id) {
          await supabase.from('admin_logs').insert({
            user_id: user.id,
            action: 'updated_moderation_rule',
            target_type: 'moderation_rule',
            target_id: editingRule.id
          });
        }

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
        if (user?.id) {
          await supabase.from('admin_logs').insert({
            user_id: user.id,
            action: 'created_moderation_rule',
            target_type: 'moderation_rule'
          });
        }

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
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          action: 'deleted_moderation_rule',
          target_type: 'moderation_rule',
          target_id: rule.id
        });
      }

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
      if (user?.id) {
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          action: `${!rule.is_active ? 'activated' : 'deactivated'}_moderation_rule`,
          target_type: 'moderation_rule',
          target_id: rule.id
        });
      }

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
    if (keywordInput.trim() && !formData.criteria.keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          keywords: [...(prev.criteria.keywords || []), keywordInput.trim()]
        }
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        keywords: prev.criteria.keywords?.filter((k: string) => k !== keyword) || []
      }
    }));
  };

  const addPattern = () => {
    if (patternInput.trim() && !formData.criteria.patterns?.includes(patternInput.trim())) {
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          patterns: [...(prev.criteria.patterns || []), patternInput.trim()]
        }
      }));
      setPatternInput('');
    }
  };

  const removePattern = (pattern: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        patterns: prev.criteria.patterns?.filter((p: string) => p !== pattern) || []
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
                      onValueChange={(value) => 
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
                    <label className="text-sm font-medium">Применять к типам контента</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(contentTypeLabels).map(([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={formData.content_types.includes(key) ? "default" : "outline"}
                          onClick={() => toggleContentType(key)}
                          className="justify-start"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Условия правила */}
                  {(formData.rule_type === 'keyword' || formData.rule_type === 'profanity') && (
                    <div>
                      <label className="text-sm font-medium">Ключевые слова</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Добавить ключевое слово"
                          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <Button type="button" onClick={addKeyword}>Добавить</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.criteria.keywords?.map((keyword: string) => (
                          <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                            {keyword} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.rule_type === 'pattern' && (
                    <div>
                      <label className="text-sm font-medium">Регулярные выражения</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={patternInput}
                          onChange={(e) => setPatternInput(e.target.value)}
                          placeholder="Добавить регулярное выражение"
                          onKeyPress={(e) => e.key === 'Enter' && addPattern()}
                        />
                        <Button type="button" onClick={addPattern}>Добавить</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.criteria.patterns?.map((pattern: string) => (
                          <Badge key={pattern} variant="secondary" className="cursor-pointer" onClick={() => removePattern(pattern)}>
                            {pattern} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.rule_type === 'length' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Мин. длина</label>
                        <Input
                          type="number"
                          value={formData.criteria.min_length}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            criteria: { ...prev.criteria, min_length: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Макс. длина</label>
                        <Input
                          type="number"
                          value={formData.criteria.max_length}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            criteria: { ...prev.criteria, max_length: parseInt(e.target.value) || 1000 }
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Действия */}
                  <div>
                    <label className="text-sm font-medium">Действие при срабатывании</label>
                    <Select
                      value={formData.actions.action_type}
                      onValueChange={(value) => 
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
                    <label className="text-sm font-medium">Приоритет (1-10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <label className="text-sm font-medium">Активировать правило</label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingRule ? 'Обновить' : 'Создать'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет созданных правил модерации</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? 'Активно' : 'Неактивно'}
                          </Badge>
                          <Badge variant="outline">
                            {ruleTypeLabels[rule.rule_type as keyof typeof ruleTypeLabels] || rule.rule_type}
                          </Badge>
                          <Badge variant={getActionColor(rule.actions?.action_type)}>
                            {actionTypeLabels[rule.actions?.action_type as keyof typeof actionTypeLabels] || rule.actions?.action_type}
                          </Badge>
                        </div>
                        
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                          {rule.content_types.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {contentTypeLabels[type as keyof typeof contentTypeLabels] || type}
                            </Badge>
                          ))}
                        </div>
                        
                        {rule.criteria?.keywords && rule.criteria.keywords.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Ключевые слова: </span>
                            {rule.criteria.keywords.slice(0, 3).map((keyword: string) => (
                              <Badge key={keyword} variant="secondary" className="text-xs mx-1">
                                {keyword}
                              </Badge>
                            ))}
                            {rule.criteria.keywords.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{rule.criteria.keywords.length - 3} еще</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRuleStatus(rule)}
                        >
                          {rule.is_active ? <CheckCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить правило?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Правило "{rule.name}" будет удалено навсегда.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(rule)}>
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};