import React from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Star, Calendar } from 'lucide-react';

const History = () => {
  const { user, userRole, signOut } = useAuth();

  const completedWorks = [
    {
      id: 1,
      title: 'Создание интернет-магазина',
      client: 'ООО "Модный стиль"',
      completedDate: '2023-12-15',
      price: 120000,
      rating: 5,
      review: 'Отличная работа! Сайт работает идеально, все требования выполнены.',
      category: 'Веб-разработка'
    },
    {
      id: 2,
      title: 'Разработка CRM системы',
      client: 'ИП Петров А.А.',
      completedDate: '2023-11-28',
      price: 85000,
      rating: 4,
      review: 'Хорошая работа, но были небольшие задержки с дедлайном.',
      category: 'Программирование'
    },
    {
      id: 3,
      title: 'Дизайн мобильного приложения',
      client: 'Стартап "Инновации"',
      completedDate: '2023-11-10',
      price: 60000,
      rating: 5,
      review: 'Превосходный дизайн! Клиенты в восторге от интерфейса.',
      category: 'UI/UX Дизайн'
    },
    {
      id: 4,
      title: 'Настройка рекламных кампаний',
      client: 'Медицинский центр "Здоровье"',
      completedDate: '2023-10-22',
      price: 35000,
      rating: 4,
      review: 'Результативная работа, трафик увеличился в 2 раза.',
      category: 'Маркетинг'
    }
  ];

  const totalEarnings = completedWorks.reduce((sum, work) => sum + work.price, 0);
  const averageRating = completedWorks.reduce((sum, work) => sum + work.rating, 0) / completedWorks.length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-steel-500'
        }`}
      />
    ));
  };

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <HistoryIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-glow">История работ</h1>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="card-steel">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {completedWorks.length}
                  </div>
                  <div className="text-steel-300">Завершенных работ</div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {totalEarnings.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-steel-300">Общий доход</div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-steel">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {averageRating.toFixed(1)}
                    </span>
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </div>
                  <div className="text-steel-300">Средний рейтинг</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* История работ */}
          <div className="space-y-4">
            {completedWorks.map((work) => (
              <Card key={work.id} className="card-steel">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-steel-100">{work.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-steel-300">
                        <span>Заказчик: {work.client}</span>
                        <Badge variant="outline" className="text-primary border-primary">
                          {work.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {work.price.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-steel-400" />
                        <span className="text-steel-400 text-sm">
                          {new Date(work.completedDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-steel-300">Оценка:</span>
                      <div className="flex items-center space-x-1">
                        {renderStars(work.rating)}
                      </div>
                    </div>
                    <div className="bg-steel-800 p-3 rounded-lg">
                      <p className="text-steel-200 italic">"{work.review}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {completedWorks.length === 0 && (
            <div className="text-center py-12">
              <HistoryIcon className="w-16 h-16 text-steel-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-steel-300 mb-2">История пуста</h3>
              <p className="text-steel-400">Ваши завершенные работы будут отображаться здесь</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;