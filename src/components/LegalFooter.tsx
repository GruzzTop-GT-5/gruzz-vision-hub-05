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
    <footer className="bg-muted/30 border-t mt-12">
      <div className="max-w-6xl mx-auto p-6">
        {/* Legal Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {legalLinks.map((link, index) => (
            <Card key={index} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {link.icon}
                  {link.title}
                  {link.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {link.badge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {link.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" asChild className="h-8 px-3">
                  <Link to={link.href} className="flex items-center gap-1">
                    Читать
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Rules Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Основные принципы GruzzTop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span>Фиксированная стоимость</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Безопасные сделки</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Честные отзывы</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-orange-600" />
                <span>Защита споров</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">О платформе</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/rules" className="hover:text-foreground transition-colors">
                  Правила использования
                </Link>
              </li>
              <li>
                <Link to="/rules#commission" className="hover:text-foreground transition-colors">
                  Тарифы и комиссии
                </Link>
              </li>
              <li>
                <Link to="/rules#disputes" className="hover:text-foreground transition-colors">
                  Разрешение споров
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Поддержка</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/chat-system" className="hover:text-foreground transition-colors">
                  Центр поддержки
                </Link>
              </li>
              <li>support@gruzztop.ru</li>
              <li>Пн-Пт 9:00-18:00 МСК</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Безопасность</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/rules#privacy" className="hover:text-foreground transition-colors">
                  Конфиденциальность
                </Link>
              </li>
              <li>
                <Link to="/rules#payments" className="hover:text-foreground transition-colors">
                  Безопасность платежей
                </Link>
              </li>
              <li>Шифрование данных</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Правовая информация</h4>
            <ul className="space-y-1">
              <li>
                <span className="text-xs">
                  Версия правил: {TERMS_VERSION}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-4 mt-6 text-center text-xs text-muted-foreground">
          <p>
            © 2024 GruzzTop. Все права защищены. | 
            Последнее обновление правил: {TERMS_LAST_UPDATED}
          </p>
          <p className="mt-1">
            Используя платформу, вы соглашаетесь с{" "}
            <Link to="/rules" className="text-primary hover:underline">
              правилами использования
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};