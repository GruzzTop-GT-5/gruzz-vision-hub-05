import React from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

const Orders = () => {
  const { user, userRole, signOut } = useAuth();

  const orders = [
    {
      id: 1,
      title: 'Разработка веб-сайта',
      client: 'ООО "Техкомпани"',
      status: 'in_progress',
      price: 50000,
      deadline: '2024-01-15',
      description: 'Создание корпоративного сайта с админ-панелью'
    },
    {
      id: 2,
      title: 'Мобильное приложение',
      client: 'Частное лицо',
      status: 'completed',
      price: 75000,
      deadline: '2023-12-20',
      description: 'iOS/Android приложение для доставки еды'
    },
    {
      id: 3,
      title: 'Настройка сервера',
      client: 'ИП Иванов',
      status: 'cancelled',
      price: 15000,
      deadline: '2024-01-10',
      description: 'Настройка VPS сервера и установка ПО'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400"><Clock className="w-3 h-3 mr-1" />В работе</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-400 border-green-400"><CheckCircle className="w-3 h-3 mr-1" />Завершен</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-400 border-red-400"><XCircle className="w-3 h-3 mr-1" />Отменен</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-glow">Мои заказы</h1>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="card-steel">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-steel-100">{order.title}</CardTitle>
                      <p className="text-steel-300">Заказчик: {order.client}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-steel-200">{order.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        {order.price.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-steel-400">
                        Срок: {new Date(order.deadline).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-steel-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-steel-300 mb-2">Нет активных заказов</h3>
              <p className="text-steel-400">Ваши заказы будут отображаться здесь</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;