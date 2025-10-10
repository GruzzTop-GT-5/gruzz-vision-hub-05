/**
 * User badge system based on rating
 * 5 levels: Новичок, Бронза, Серебро, Золото, Платина
 */

export interface BadgeInfo {
  name: string;
  level: number;
  color: string;
  icon: string;
  description: string;
}

export function getUserBadge(rating: number): BadgeInfo {
  if (rating >= 4.8) {
    return {
      name: 'Платина',
      level: 5,
      color: '#E5E4E2',
      icon: '💎',
      description: 'Выдающийся исполнитель'
    };
  } else if (rating >= 4.5) {
    return {
      name: 'Золото',
      level: 4,
      color: '#FFD700',
      icon: '🥇',
      description: 'Отличный исполнитель'
    };
  } else if (rating >= 4.0) {
    return {
      name: 'Серебро',
      level: 3,
      color: '#C0C0C0',
      icon: '🥈',
      description: 'Хороший исполнитель'
    };
  } else if (rating >= 3.5) {
    return {
      name: 'Бронза',
      level: 2,
      color: '#CD7F32',
      icon: '🥉',
      description: 'Надежный исполнитель'
    };
  } else {
    return {
      name: 'Новичок',
      level: 1,
      color: '#94A3B8',
      icon: '⭐',
      description: 'Начинающий исполнитель'
    };
  }
}

export function getBadgeByLevel(level: number): BadgeInfo {
  switch (level) {
    case 5:
      return {
        name: 'Платина',
        level: 5,
        color: '#E5E4E2',
        icon: '💎',
        description: 'Выдающийся исполнитель'
      };
    case 4:
      return {
        name: 'Золото',
        level: 4,
        color: '#FFD700',
        icon: '🥇',
        description: 'Отличный исполнитель'
      };
    case 3:
      return {
        name: 'Серебро',
        level: 3,
        color: '#C0C0C0',
        icon: '🥈',
        description: 'Хороший исполнитель'
      };
    case 2:
      return {
        name: 'Бронза',
        level: 2,
        color: '#CD7F32',
        icon: '🥉',
        description: 'Надежный исполнитель'
      };
    default:
      return {
        name: 'Новичок',
        level: 1,
        color: '#94A3B8',
        icon: '⭐',
        description: 'Начинающий исполнитель'
      };
  }
}
