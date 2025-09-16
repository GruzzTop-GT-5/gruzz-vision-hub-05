import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, Calendar, TriangleAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const History = () => {
  const { user, userRole, signOut } = useAuth();
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedCount: 0,
    totalEarnings: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchCompletedOrders();
    }
  }, [user?.id]);

  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch completed orders where user is executor
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:profiles!orders_client_id_fkey(display_name, full_name),
          reviews:order_reviews!order_reviews_order_id_fkey(rating, comment)
        `)
        .eq('executor_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setCompletedOrders(orders || []);
      
      // Calculate stats
      const totalEarnings = orders?.reduce((sum, order) => sum + Number(order.price), 0) || 0;
      const ratingsArray = orders?.flatMap(order => 
        order.reviews?.map(review => review.rating) || []
      ) || [];
      const averageRating = ratingsArray.length > 0 
        ? ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length 
        : 0;

      setStats({
        completedCount: orders?.length || 0,
        totalEarnings,
        averageRating
      });
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!user) {
    return (
      <AnimatedBackground className="min-h-screen flex items-center justify-center">
        <Card className="card-steel p-8 text-center">
          <h2 className="text-2xl font-bold text-glow mb-4">Вход требуется</h2>
          <p className="text-steel-400">Войдите в систему для просмотра истории работ</p>
        </Card>
      </AnimatedBackground>
    );
  }

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <AnimatedBackground className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-glow">История работ</h1>
          </div>

          {/* Статистика в стиле изображения */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Завершенных работ */}
            <Card className="card-steel border-steel-600/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-steel-100 mb-1">
                      {loading ? "..." : stats.completedCount}
                    </div>
                    <div className="text-sm text-steel-400">Завершенных работ</div>
                  </div>
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Общий доход */}
            <Card className="card-steel border-steel-600/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {loading ? "..." : `${stats.totalEarnings.toLocaleString('ru-RU')} GT`}
                    </div>
                    <div className="text-sm text-steel-400">Общий доход</div>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Средний рейтинг */}
            <Card className="card-steel border-steel-600/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-2xl font-bold text-yellow-400">
                        {loading ? "..." : stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
                      </span>
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <div className="text-sm text-steel-400">Средний рейтинг</div>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* История работ */}
          {!loading && (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <Card key={order.id} className="card-steel">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl text-steel-100">{order.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-steel-300">
                          <span>Заказчик: {order.client?.display_name || order.client?.full_name || 'Неизвестен'}</span>
                          <Badge variant="outline" className="text-primary border-primary">
                            {order.category || 'Без категории'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {Number(order.price).toLocaleString('ru-RU')} GT
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-steel-400" />
                          <span className="text-steel-400 text-sm">
                            {order.completed_at ? new Date(order.completed_at).toLocaleDateString('ru-RU') : 'Дата неизвестна'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.reviews && order.reviews.length > 0 && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-steel-300">Оценка:</span>
                            <div className="flex items-center space-x-1">
                              {renderStars(order.reviews[0].rating)}
                            </div>
                          </div>
                          <div className="bg-steel-800 p-3 rounded-lg">
                            <p className="text-steel-200 italic">"{order.reviews[0].comment}"</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && completedOrders.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-steel-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-steel-300 mb-2">История пуста</h3>
              <p className="text-steel-400">Ваши завершенные работы будут отображаться здесь</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-steel-400">Загрузка истории работ...</p>
            </div>
          )}
        </div>
      </AnimatedBackground>
    </Layout>
  );
};

export default History;