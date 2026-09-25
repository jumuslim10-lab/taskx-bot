# ✅ КОД ЗАГРУЖЕН НА GITHUB!

**Репозиторий:** https://github.com/jumuslim10-lab/taskx-bot

## 🚀 СЛЕДУЮЩИЙ ШАГ: Подключить к Railway

### Вариант 1: Через Railway Dashboard (РЕКОМЕНДУЮ)

1. **Открыть ваш Railway проект:**
   https://railway.app/project/d2536156-bb46-4bcf-a463-4dd88210b132

2. **Подключить GitHub репозиторий:**
   - Settings → Source → Connect GitHub Repo
   - Выбрать: `jumuslim10-lab/taskx-bot`
   - Railway автоматически обнаружит `railway.json` и `Procfile`

3. **Добавить переменные окружения:**
   - Settings → Variables → Raw Editor
   - Вставить:
   ```
   BOT_TOKEN=8666914335:AAGnN7l7lUUPeiFnTqHzmq4GCBwqK9zGip8
   SUPABASE_URL=https://hjoosjstmginrpatkvbm.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb29zanN0bWdpbnJwYXRrdmJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3NTI5MywiZXhwIjoyMTA1NjUxMjkzfQ.wuMdC1ZsckIUB5PKjRdNH1vaJLSaRxjzevBxay2DbBI
   ADMIN_IDS=5819052050
   NODE_ENV=production
   ```

4. **Deploy!**
   Railway автоматически задеплоит после сохранения переменных.

---

### Вариант 2: Создать новый Railway проект

Если хотите начать с нуля:

1. Зайти: https://railway.app/new
2. Deploy from GitHub repo
3. Выбрать: `jumuslim10-lab/taskx-bot`
4. Добавить переменные (см. выше)
5. Deploy

---

## 📊 Что будет после деплоя:

✅ Railway запустит `node main-bot.js`
✅ Бот подключится к Supabase
✅ Telegram бот станет активным
✅ Все команды будут работать:
   - /start, /menu, /help
   - /take, /complete, /confirm
   - /deposit, /withdraw
   - Support система
   - Admin панель

---

## 🔍 Проверка после деплоя:

1. **Логи Railway:** Settings → Logs
2. **Telegram бот:** Найти вашего бота и отправить `/start`
3. **Тест создания задания:** /menu → Создать задание
4. **Тест кошелька:** /menu → Кошелёк

---

**ГОТОВО! Теперь:**
1. Откройте https://railway.app/project/d2536156-bb46-4bcf-a463-4dd88210b132
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Проверьте деплой!

Нужна помощь с настройкой Railway?
