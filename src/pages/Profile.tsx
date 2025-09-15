import React from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Edit, Star, MapPin, Calendar, Briefcase, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, userRole, signOut } = useAuth();

  // Mock user profile data
  const profileData = {
    fullName: 'Иван Петрович Сидоров',
    age: 28,
    citizenship: 'Россия',
    qualification: 'Веб-разработчик',
    bio: 'Опытный fullstack разработчик с 5+ годами опыта. Специализируюсь на React, Node.js и современных веб-технологиях.',
    rating: 4.8,
    completedProjects: 47,
    joinDate: '2022-03-15',
    location: 'Москва, Россия',
    phone: user?.phone || '+7 (999) 123-45-67',
    email: user?.email || 'ivan.sidorov@example.com'
  };

  const skills = [
    'React', 'Node.js', 'TypeScript', 'Python', 'PostgreSQL', 
    'Docker', 'AWS', 'UI/UX Design', 'Mobile Development'
  ];

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: fullStars }, (_, index) => (
          <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        )}
        <span className="text-steel-300 ml-2">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-glow">Мой профиль</h1>
            </div>
            <Link to="/edit-profile">
              <Button className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Редактировать профиль</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100">Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-electric-600 text-steel-900 text-xl font-bold">
                        {profileData.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-steel-100">{profileData.fullName}</h2>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-steel-400" />
                        <span className="text-steel-300">{profileData.qualification}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-steel-400" />
                        <span className="text-steel-300">{profileData.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-steel-400 text-sm">Возраст</label>
                      <p className="text-steel-100">{profileData.age} лет</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-steel-400 text-sm">Гражданство</label>
                      <p className="text-steel-100">{profileData.citizenship}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-steel-400 text-sm">Телефон</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-steel-400" />
                        <p className="text-steel-100">{profileData.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-steel-400 text-sm">Email</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-steel-400" />
                        <p className="text-steel-100">{profileData.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-steel-400 text-sm">О себе</label>
                    <p className="text-steel-200 leading-relaxed">{profileData.bio}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Навыки */}
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100">Навыки и технологии</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-primary border-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Статистика */}
            <div className="space-y-6">
              <Card className="card-steel">
                <CardHeader>
                  <CardTitle className="text-steel-100">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {profileData.completedProjects}
                    </div>
                    <div className="text-steel-300 text-sm">Завершенных проектов</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {renderStars(profileData.rating)}
                    </div>
                    <div className="text-steel-300 text-sm">Средний рейтинг</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-steel-400" />
                      <span className="text-steel-300">
                        {new Date(profileData.joinDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="text-steel-400 text-sm">Дата регистрации</div>
                  </div>
                </CardContent>
              </Card>

              {/* Роль пользователя */}
              {userRole && userRole !== 'user' && (
                <Card className="card-steel">
                  <CardHeader>
                    <CardTitle className="text-steel-100">Статус</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant="outline" 
                      className={`w-full justify-center py-2 ${
                        userRole === 'system_admin' 
                          ? 'text-red-400 border-red-400'
                          : userRole === 'admin'
                          ? 'text-primary border-primary'
                          : userRole === 'moderator'
                          ? 'text-yellow-400 border-yellow-400'
                          : 'text-green-400 border-green-400'
                      }`}
                    >
                      {userRole === 'system_admin' && 'Системный администратор'}
                      {userRole === 'admin' && 'Администратор'}
                      {userRole === 'moderator' && 'Модератор'}
                      {userRole === 'support' && 'Поддержка'}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;