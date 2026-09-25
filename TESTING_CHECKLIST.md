# ✅ CHECKLIST: Проверка деплоя

## 📋 Что нужно проверить в Railway:

### 1. Deployment Status
- [ ] Зайти: https://railway.app/project/398ee4a3-886e-4fa4-96d4-f2f76bbd7699
- [ ] Deployments → последний деплой должен быть **SUCCESS** (зеленый)
- [ ] Если **FAILED** (красный) - смотрим логи

### 2. Логи Railway
В разделе **Logs** должно быть:
```
🤖 TaskX Main Bot запущен!
💾 База данных: Supabase PostgreSQL
🔗 Project: hjoosjstmginrpatkvbm
👨‍💼 Админов: 1
📱 Откройте Telegram и найдите своего бота
💬 Отправьте /start
```

### 3. Проверка Variables
Settings → Variables - должны быть:
- [x] `BOT_TOKEN`
- [x] `SUPABASE_URL`
- [x] `SUPABASE_KEY`
- [x] `ADMIN_IDS`
- [x] `NODE_ENV`

### 4. Проверка Source
Settings → Source:
- [ ] Подключен GitHub: `jumuslim10-lab/taskx-bot`
- [ ] Ветка: `main`
- [ ] Root Directory: `/`

### 5. Тест в Telegram
Откройте вашего бота в Telegram:

**Команды для теста:**
```
/start
/menu
/help
```

**Ожидаемый результат:**
- Приветственное сообщение с профилем
- Меню с кнопками (Найти задания, Создать задание, Кошелёк, Профиль, Поддержка)
- Справка по командам

### 6. Тест создания задания
```
/menu → Создать задание
```
1. Введите название: "Тестовое задание"
2. Введите описание: "Проверка работы бота"
3. Введите цену: 100

**Ожидаемый результат:**
- Задание создано
- Баланс уменьшился на 100 сом
- Frozen balance увеличился на 100 сом

### 7. Проверка Supabase
Зайти в Supabase:
- https://supabase.com/dashboard/project/hjoosjstmginrpatkvbm
- Table Editor → `tasks`
- Должно быть новое задание со статусом `PUBLISHED`

---

## ❌ Если что-то не работает:

### Проблема: Bot failed to start
**Решение:**
1. Проверить логи - найти ошибку
2. Проверить `BOT_TOKEN` - корректный ли?
3. Проверить `SUPABASE_KEY` - полный ли (очень длинный)?

### Проблема: Unauthorized / Can't connect to Supabase
**Решение:**
1. Проверить `SUPABASE_URL` - правильный ли?
2. Проверить `SUPABASE_KEY` - это Service Role Key (не anon key)?

### Проблема: Command не работает
**Решение:**
1. Проверить логи - есть ли ошибки?
2. Перезапустить деплой: Settings → Redeploy

---

## 🎯 Что дальше после успешного теста:

1. ✅ Протестировать весь цикл задания:
   - Создать задание (как заказчик)
   - Принять задание `/take TASK_ID` (как исполнитель, другой аккаунт)
   - Завершить `/complete TASK_ID`
   - Подтвердить `/confirm TASK_ID`

2. ✅ Протестировать поддержку:
   - /menu → Поддержка → Отзыв

3. ✅ Протестировать админ-панель:
   - /menu → Админ-панель (только для вашего Telegram ID)

4. ✅ Удалить старый Railway проект (если нужно):
   - https://railway.app/project/d2536156-bb46-4bcf-a463-4dd88210b132
   - Settings → Delete Project

---

**Напишите что показывают логи Railway и работает ли бот в Telegram!** 📱
