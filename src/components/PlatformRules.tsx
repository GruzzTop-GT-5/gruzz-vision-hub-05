import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Shield, 
  CreditCard, 
  Scale, 
  Users,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { PLATFORM_RULES, TERMS_VERSION, TERMS_LAST_UPDATED } from '@/data/legal';

interface RulesSectionProps {
  title: string;
  content: Array<{
    section: string;
    items: string[];
  }>;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

const RulesSection = ({ title, content, icon, variant = 'default' }: RulesSectionProps) => {
  let cardClasses = 'bg-card border-border';
  
  if (variant === 'warning') {
    cardClasses = 'bg-orange-500/5 border-orange-500/20';
  } else if (variant === 'success') {
    cardClasses = 'bg-green-500/5 border-green-500/20';
  } else if (variant === 'info') {
    cardClasses = 'bg-blue-500/5 border-blue-500/20';
  }

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.map((section, index) => (
          <div key={index}>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {section.section}
            </h4>
            <ul className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {index < content.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const PlatformRules = () => {
  const [activeTab, setActiveTab] = useState("commission");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Правила платформы GruzzTop
        </h1>
        <p className="text-muted-foreground">
          Ознакомьтесь с правилами использования нашей платформы
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">
            Версия {TERMS_VERSION}
          </Badge>
          <span>Обновлено: {TERMS_LAST_UPDATED}</span>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-orange-300">
                Важная информация
              </p>
            <p className="text-sm text-orange-200">
                Использование платформы означает полное согласие с данными правилами. 
                При изменении правил все пользователи получают уведомление.
            </p>
            <p className="text-sm text-orange-100 mt-2 font-medium">
                ⚠️ Приложение находится в стадии разработки. Возможно, не все правила работают корректно.
            </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="commission" className="text-xs">
            <CreditCard className="h-4 w-4 mr-1" />
            Комиссии
          </TabsTrigger>
          <TabsTrigger value="responsibilities" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Обязанности
          </TabsTrigger>
          <TabsTrigger value="disputes" className="text-xs">
            <Scale className="h-4 w-4 mr-1" />
            Споры
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">
            <Shield className="h-4 w-4 mr-1" />
            Платежи
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs">
            <FileText className="h-4 w-4 mr-1" />
            Конфиденциальность
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full">
          <TabsContent value="commission" className="mt-6">
            <RulesSection
              title={PLATFORM_RULES.commission.title}
              content={PLATFORM_RULES.commission.content}
              icon={<CreditCard className="h-5 w-5 text-green-500" />}
              variant="success"
            />
          </TabsContent>

          <TabsContent value="responsibilities" className="mt-6">
            <RulesSection
              title={PLATFORM_RULES.responsibilities.title}
              content={PLATFORM_RULES.responsibilities.content}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              variant="info"
            />
          </TabsContent>

          <TabsContent value="disputes" className="mt-6">
            <RulesSection
              title={PLATFORM_RULES.disputes.title}
              content={PLATFORM_RULES.disputes.content}
              icon={<Scale className="h-5 w-5 text-orange-500" />}
              variant="warning"
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <RulesSection
              title={PLATFORM_RULES.payments.title}
              content={PLATFORM_RULES.payments.content}
              icon={<Shield className="h-5 w-5 text-purple-500" />}
            />
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <RulesSection
              title={PLATFORM_RULES.privacy.title}
              content={PLATFORM_RULES.privacy.content}
              icon={<FileText className="h-5 w-5 text-indigo-500" />}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Контактная информация
          </CardTitle>
          <CardDescription>
            Если у вас есть вопросы по правилам платформы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <strong>Email поддержки:</strong> gruztop00@gmail.com
          </p>
          <p className="text-sm">
            <strong>Часы работы поддержки:</strong> Пн-Пт 9:00-18:00 (МСК)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};