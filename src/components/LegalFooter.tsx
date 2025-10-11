import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Scale, CreditCard, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TERMS_VERSION, TERMS_LAST_UPDATED } from '@/data/legal';

export const LegalFooter: React.FC = () => {
  const legalLinks = [
    {
      title: "Правила платформы",
      description: "Полные правила использования GruzzTop",
      icon: <FileText className="h-4 w-4" />,
      href: "/rules",
      badge: "Обновлено"
    },
    {
      title: "Политика конфиденциальности",
      description: "Как мы защищаем ваши данные",
      icon: <Shield className="h-4 w-4" />,
      href: "/rules#privacy",
      badge: null
    },
    {
      title: "Пользовательское соглашение",
      description: "Условия использования сервиса",
      icon: <Scale className="h-4 w-4" />,
      href: "/rules#responsibilities",
      badge: null
    }
  ];

  return (
    <footer className="bg-muted/30 border-t mt-6 xs:mt-8 sm:mt-12">
      <div className="max-w-6xl mx-auto p-3 xs:p-4 sm:p-6">
        {/* Legal Links Section - Компактная версия для мобильных */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
          {legalLinks.map((link, index) => (
            <Card key={index} className="hover:bg-muted/50 transition-all duration-300">
              <CardHeader className="p-2 xs:p-3 sm:pb-3">
                <CardTitle className="text-xs xs:text-sm flex items-center gap-1.5 xs:gap-2">
                  {link.icon}
                  <span className="truncate">{link.title}</span>
                  {link.badge && (
                    <Badge variant="secondary" className="text-[10px] xs:text-xs hidden xs:inline-flex">
                      {link.badge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[10px] xs:text-xs hidden sm:block">
                  {link.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 xs:p-3 pt-0">
                <Button variant="ghost" size="sm" asChild className="h-6 xs:h-8 px-2 xs:px-3 text-xs">
                  <Link to={link.href} className="flex items-center gap-1">
                    Читать
                    <ExternalLink className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Rules Summary - Компактная версия */}
        <Card className="mb-4 xs:mb-6">
          <CardHeader className="p-2 xs:p-3 sm:p-4">
            <CardTitle className="text-sm xs:text-base">Основные принципы</CardTitle>
          </CardHeader>
          <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 text-xs xs:text-sm">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <CreditCard className="h-3 w-3 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
                <span className="truncate">Фикс. стоимость</span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Shield className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">Безопасность</span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Users className="h-3 w-3 xs:h-4 xs:w-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">Честные отзывы</span>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <Scale className="h-3 w-3 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
                <span className="truncate">Защита</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Information - Упрощенная версия для мобильных */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 text-xs xs:text-sm text-muted-foreground mb-4">
          <div>
            <h4 className="font-medium text-foreground mb-1 xs:mb-2 text-xs xs:text-sm">О платформе</h4>
            <ul className="space-y-0.5 xs:space-y-1 text-[10px] xs:text-xs">
              <li>
                <Link to="/rules" className="hover:text-foreground transition-colors truncate block">
                  Правила
                </Link>
              </li>
              <li>
                <Link to="/rules#commission" className="hover:text-foreground transition-colors truncate block">
                  Тарифы
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1 xs:mb-2 text-xs xs:text-sm">Поддержка</h4>
            <ul className="space-y-0.5 xs:space-y-1 text-[10px] xs:text-xs">
              <li>
                <Link to="/chat-system" className="hover:text-foreground transition-colors truncate block">
                  Центр поддержки
                </Link>
              </li>
              <li className="truncate">9:00-18:00 МСК</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1 xs:mb-2 text-xs xs:text-sm">Безопасность</h4>
            <ul className="space-y-0.5 xs:space-y-1 text-[10px] xs:text-xs">
              <li>
                <Link to="/rules#privacy" className="hover:text-foreground transition-colors truncate block">
                  Конфиденциальность
                </Link>
              </li>
              <li className="truncate">Шифрование</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-1 xs:mb-2 text-xs xs:text-sm">Инфо</h4>
            <ul className="space-y-0.5 xs:space-y-1 text-[10px] xs:text-xs">
              <li className="truncate">
                v{TERMS_VERSION}
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright - Компактная версия */}
        <div className="border-t pt-2 xs:pt-3 sm:pt-4 text-center text-[10px] xs:text-xs text-muted-foreground">
          <p className="mb-1">
            © 2024 GruzzTop | {TERMS_LAST_UPDATED}
          </p>
          <p>
            <Link to="/rules" className="text-primary hover:underline">
              Правила использования
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};