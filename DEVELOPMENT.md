# Руководство разработчика - GruzzTop

## 🏗 Архитектура проекта

### Основные принципы
- **Модульность**: каждый компонент отвечает за свою функцию
- **Типобезопасность**: TypeScript для всего кода
- **Переиспользование**: DRY принцип для компонентов и логики
- **Производительность**: ленивая загрузка и мемоизация

## 📂 Структура файлов

```
src/
├── components/          # React компоненты
│   ├── ui/             # Базовые UI (shadcn/ui)
│   ├── layout/         # Макет приложения
│   ├── features/       # Функциональные компоненты
│   └── forms/          # Формы
├── hooks/              # Пользовательские хуки
│   ├── useAuth.tsx     # Аутентификация
│   ├── useData.ts      # Работа с данными
│   └── useTelegram.ts  # Telegram интеграция
├── pages/              # Страницы приложения
├── services/           # API и внешние сервисы
│   └── api.ts          # Централизованный API
├── types/              # TypeScript типы
│   └── index.ts        # Все интерфейсы
├── utils/              # Утилиты
│   ├── helpers.ts      # Вспомогательные функции
│   └── security.ts     # Безопасность
├── config/             # Конфигурация
│   └── index.ts        # Настройки приложения
└── lib/                # Библиотеки
    └── utils.ts        # Утилиты shadcn/ui
```

## 🔧 Добавление новой функции

### 1. Определение типов
```typescript
// src/types/index.ts
export interface NewFeature {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at?: string;
}
```

### 2. API методы
```typescript
// src/services/api.ts
async getNewFeatures(): Promise<PaginatedResponse<NewFeature>> {
  // реализация
}
```

### 3. Хук для работы с данными
```typescript
// src/hooks/useNewFeature.ts
export const useNewFeature = () => {
  const fetchFeatures = useCallback(
    (page: number, limit: number) => apiService.getNewFeatures(page, limit),
    []
  );
  
  return usePagination(fetchFeatures);
};
```

### 4. Компонент
```typescript
// src/components/NewFeatureCard.tsx
import type { NewFeature } from '@/types';

interface Props {
  feature: NewFeature;
  onUpdate: (id: string) => void;
}

export const NewFeatureCard = ({ feature, onUpdate }: Props) => {
  // реализация
};
```

### 5. Страница
```typescript
// src/pages/NewFeature.tsx
export const NewFeaturePage = () => {
  const { data, loading } = useNewFeature();
  
  return (
    <Layout>
      {/* контент */}
    </Layout>
  );
};
```

### 6. Роутинг
```typescript
// src/App.tsx
import { NewFeaturePage } from '@/pages/NewFeature';

// В Routes:
<Route path="/new-feature" element={<NewFeaturePage />} />
```

## 🎨 Стилизация

### Design System
- Используем CSS переменные из `src/index.css`
- Semantic tokens: `--primary`, `--secondary`, `--accent`
- Темная/светлая тема поддерживается автоматически

### Компоненты UI
```typescript
// Используем компоненты из ui/
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Кастомные варианты через className
<Button variant="primary" size="lg" className="special-style">
  Кнопка
</Button>
```

## 📱 Telegram интеграция

### Использование хука
```typescript
import { useTelegram } from '@/hooks/useTelegram';

const { user, isInTelegram, hapticFeedback } = useTelegram();

// Проверка среды
if (isInTelegram) {
  // Логика для Telegram
  hapticFeedback?.impactOccurred('light');
}
```

### Компоненты для Telegram
```typescript
import { TelegramLayout } from '@/components/TelegramLayout';
import { TelegramMainButton } from '@/components/TelegramMainButton';

<TelegramLayout>
  <YourContent />
  <TelegramMainButton 
    text="Продолжить"
    onClick={handleContinue}
  />
</TelegramLayout>
```

## 🗄 Работа с базой данных

### Структура запросов
```typescript
// Чтение данных
const { data, error } = await supabase
  .from('table_name')
  .select('*, related_table(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Создание данных
const { data, error } = await supabase
  .from('table_name')
  .insert({
    user_id: userId,
    title: 'Example'
  })
  .select()
  .single();
```

### RLS политики
- Всегда используйте RLS для безопасности
- Политики определены в миграциях
- Пользователи видят только свои данные

## 🔐 Безопасность

### Аутентификация
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, userRole, signOut } = useAuth();

// Проверка роли
if (userRole === 'admin') {
  // Админский функционал
}
```

### Валидация данных
```typescript
import { validateFileSize, validateFileType } from '@/utils/helpers';

const isValid = validateFileSize(file.size) && validateFileType(file.type);
```

## 📊 Производительность

### Оптимизация
- Используйте `useMemo` для тяжелых вычислений
- `useCallback` для функций в зависимостях
- Lazy loading для страниц

```typescript
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

const handleClick = useCallback(() => {
  // логика
}, [dependency]);
```

### Пагинация
```typescript
const { data, loading, loadMore, hasMore } = usePagination(
  fetchFunction,
  dependencies,
  limit
);
```

## 🧪 Тестирование

### Принципы
- Тестируем поведение, а не реализацию
- Mock внешние зависимости
- Покрываем critical path

### Пример теста
```typescript
import { render, screen } from '@testing-library/react';
import { NewFeatureCard } from '@/components/NewFeatureCard';

test('отображает название функции', () => {
  const feature = { id: '1', name: 'Test Feature', status: 'active' };
  render(<NewFeatureCard feature={feature} onUpdate={() => {}} />);
  
  expect(screen.getByText('Test Feature')).toBeInTheDocument();
});
```

## 🚀 Развертывание

### Подготовка
1. Проверить TypeScript: `npm run type-check`
2. Собрать проект: `npm run build`
3. Тестировать сборку: `npm run preview`

### GitHub интеграция
- Автоматическая синхронизация с Lovable
- CI/CD через GitHub Actions
- Environment variables в настройках

## 📈 Мониторинг

### Логирование
```typescript
import { logError } from '@/utils/helpers';

try {
  // код
} catch (error) {
  logError(error, 'ComponentName');
}
```

### Performance
```typescript
import { measurePerformance } from '@/utils/helpers';

const result = measurePerformance('ExpensiveOperation', () => {
  return expensiveFunction();
});
```

## 🔄 Обновления

### Добавление зависимостей
- Используйте только необходимые пакеты
- Проверяйте совместимость версий
- Обновляйте package.json через Lovable UI

### Миграции БД
- Всегда через Supabase UI
- Тестируйте на development среде
- Делайте бэкапы перед production

## 💡 Best Practices

### Код
- Используйте TypeScript строго
- Следуйте принципам SOLID
- Пишите самодокументирующийся код
- Комментируйте сложную логику

### Компоненты
- Один компонент = одна ответственность
- Props интерфейсы обязательны
- Избегайте глубокой вложенности
- Используйте composition pattern

### Стили
- Mobile-first подход
- Semantic tokens вместо прямых цветов
- Консистентные отступы и размеры
- Accessibility обязательно

### Производительность
- Оптимизируйте изображения
- Ленивая загрузка для тяжелого контента
- Дебаунс для поиска и фильтров
- Кэширование API запросов

---

*Этот документ поможет новым разработчикам быстро включиться в проект и поддерживать высокое качество кода.*