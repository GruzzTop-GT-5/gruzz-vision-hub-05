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
  Info,
  Award
} from 'lucide-react';
import { PLATFORM_RULES, TERMS_VERSION, TERMS_LAST_UPDATED } from '@/data/legal';
import { RatingSystemInfo } from '@/components/RatingSystemInfo';

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
  let cardClasses = 'card-steel border-2';
  let headerGradient = '';
  
  if (variant === 'warning') {
    cardClasses = 'bg-gradient-to-br from-orange-500/5 to-orange-600/10 border-2 border-orange-500/30';
    headerGradient = 'bg-gradient-to-r from-orange-500/10 to-orange-600/10';
  } else if (variant === 'success') {
    cardClasses = 'bg-gradient-to-br from-green-500/5 to-green-600/10 border-2 border-green-500/30';
    headerGradient = 'bg-gradient-to-r from-green-500/10 to-green-600/10';
  } else if (variant === 'info') {
    cardClasses = 'bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-2 border-blue-500/30';
    headerGradient = 'bg-gradient-to-r from-blue-500/10 to-blue-600/10';
  }

  return (
    <Card className={cardClasses}>
      <CardHeader className={headerGradient}>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-12 h-12 rounded-full bg-steel-800/50 flex items-center justify-center">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {content.map((section, index) => (
          <div key={index} className="space-y-3">
            <h4 className="font-bold text-lg text-steel-100 flex items-center gap-2 pb-2 border-b border-steel-700">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              {section.section}
            </h4>
            <ul className="space-y-2 pl-2">
              {section.items.map((item, itemIndex) => {
                const isWarning = item.includes('⚠️') || item.includes('ВАЖНО') || item.includes('НЕ');
                const isHighlight = item.includes('💡') || item.includes('1 GT');
                
                return (
                  <li 
                    key={itemIndex} 
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      isWarning ? 'bg-orange-500/10 border-l-4 border-orange-500 pl-3' :
                      isHighlight ? 'bg-primary/10 border-l-4 border-primary pl-3' :
                      'hover:bg-steel-800/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      isWarning ? 'bg-orange-500' :
                      isHighlight ? 'bg-primary' :
                      'bg-steel-500'
                    }`} />
                    <span className={`text-sm leading-relaxed ${
                      isWarning ? 'text-orange-200 font-medium' :
                      isHighlight ? 'text-primary font-medium' :
                      'text-steel-300'
                    }`}>
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
            {index < content.length - 1 && <Separator className="mt-4 bg-steel-700" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const PlatformRules = () => {
  const [activeTab, setActiveTab] = useState("rating");

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-electric-600 mb-4">
          <FileText className="w-10 h-10 text-steel-900" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-electric-400 to-primary bg-clip-text text-transparent animate-glow">
          Правила платформы
        </h1>
        <p className="text-lg text-steel-300 max-w-2xl mx-auto">
          Ознакомьтесь с правилами использования GruzzTop - платформы для поиска исполнителей
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Версия {TERMS_VERSION}
          </Badge>
          <span className="text-steel-400">Обновлено: {TERMS_LAST_UPDATED}</span>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
            </div>
            <div className="space-y-2 flex-1">
              <p className="font-bold text-xl text-orange-300">
                ⚠️ Важная информация
              </p>
              <p className="text-steel-200 leading-relaxed">
                Использование платформы означает полное согласие с данными правилами. 
                При изменении правил все пользователи получают уведомление.
              </p>
              <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-200 font-medium">
                  💡 Приложение находится в стадии активной разработки. Некоторые функции могут работать не в полную силу.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-steel-800/50 p-2">
          <TabsTrigger 
            value="rating" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3"
          >
            <Award className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Рейтинг</span>
            <span className="sm:hidden">Рейтинг</span>
          </TabsTrigger>
          <TabsTrigger 
            value="commission" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">GT Коины</span>
            <span className="sm:hidden">Коины</span>
          </TabsTrigger>
          <TabsTrigger 
            value="responsibilities"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3"
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Обязанности</span>
            <span className="sm:hidden">Права</span>
          </TabsTrigger>
          <TabsTrigger 
            value="disputes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3"
          >
            <Scale className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Споры</span>
            <span className="sm:hidden">Споры</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3 hover:scale-100 active:scale-100"
          >
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Пополнение</span>
            <span className="sm:hidden">Оплата</span>
          </TabsTrigger>
          <TabsTrigger 
            value="privacy"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-electric-600 data-[state=active]:text-steel-900 py-3 hover:scale-100 active:scale-100"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Конфиденциальность</span>
            <span className="sm:hidden">Данные</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] w-full pr-4">
          <TabsContent value="rating" className="mt-0">
            <RatingSystemInfo />
          </TabsContent>

          <TabsContent value="commission" className="mt-0">
            <RulesSection
              title={PLATFORM_RULES.commission.title}
              content={PLATFORM_RULES.commission.content}
              icon={<CreditCard className="h-6 w-6 text-primary" />}
              variant="success"
            />
          </TabsContent>

          <TabsContent value="responsibilities" className="mt-0">
            <RulesSection
              title={PLATFORM_RULES.responsibilities.title}
              content={PLATFORM_RULES.responsibilities.content}
              icon={<Users className="h-6 w-6 text-blue-400" />}
              variant="info"
            />
          </TabsContent>

          <TabsContent value="disputes" className="mt-0">
            <RulesSection
              title={PLATFORM_RULES.disputes.title}
              content={PLATFORM_RULES.disputes.content}
              icon={<Scale className="h-6 w-6 text-orange-400" />}
              variant="warning"
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <RulesSection
              title={PLATFORM_RULES.payments.title}
              content={PLATFORM_RULES.payments.content}
              icon={<Shield className="h-6 w-6 text-purple-400" />}
            />
          </TabsContent>

          <TabsContent value="privacy" className="mt-0">
            <RulesSection
              title={PLATFORM_RULES.privacy.title}
              content={PLATFORM_RULES.privacy.content}
              icon={<FileText className="h-6 w-6 text-indigo-400" />}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Contact Information */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-electric-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Info className="h-5 w-5 text-primary" />
            </div>
            Нужна помощь?
          </CardTitle>
          <CardDescription className="text-steel-300">
            Свяжитесь с нами, если у вас есть вопросы по правилам платформы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-steel-800/50">
            <span className="text-steel-400 font-medium min-w-[140px]">Email поддержки:</span>
            <span className="text-primary font-semibold">gruztop00@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-steel-800/50">
            <span className="text-steel-400 font-medium min-w-[140px]">Часы работы:</span>
            <span className="text-steel-200">Пн-Пт 9:00-18:00 (МСК)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};