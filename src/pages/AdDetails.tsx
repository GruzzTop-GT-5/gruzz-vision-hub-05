import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Calendar, MapPin, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Ad = Database['public']['Tables']['ads']['Row'] & {
  profiles?: {
    display_name?: string;
    phone?: string;
  };
};

export default function AdDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('ads')
          .select(`
            *,
            profiles (
              display_name,
              phone
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAd(data);
      } catch (error) {
        console.error('Error fetching ad:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  if (!user) {
    return (
      <Layout user={user} userRole={null} onSignOut={() => {}}>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Войдите в систему для просмотра объявления</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout user={user} userRole={null} onSignOut={() => {}}>
        <div className="container mx-auto px-4 py-8">
          <div>Загрузка...</div>
        </div>
      </Layout>
    );
  }

  if (!ad) {
    return (
      <Layout user={user} userRole={null} onSignOut={() => {}}>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Объявление не найдено</p>
              <Button asChild className="mt-4">
                <Link to="/ads">Вернуться к объявлениям</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userRole={null} onSignOut={() => {}}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/ads">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к объявлениям
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{ad.title}</CardTitle>
              <Badge variant="default">
                {ad.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-muted-foreground">{ad.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Создано: {new Date(ad.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>


              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Автор: {ad.profiles?.display_name || `ID: ${ad.user_id.slice(0, 8)}...`}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Цена</h3>
              <p className="text-2xl font-bold text-primary">
                {ad.price.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button className="w-full">
                Связаться с автором
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}