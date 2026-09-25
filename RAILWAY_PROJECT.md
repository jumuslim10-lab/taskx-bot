# Railway Project Setup

## 🎯 Проект ID: 398ee4a3-886e-4fa4-96d4-f2f76bbd7699

## ✅ ЧТО ДЕЛАТЬ:

### Способ 1: Через Railway Dashboard (БЕЗ CLI)

1. **Открыть проект:**
   https://railway.app/project/398ee4a3-886e-4fa4-96d4-f2f76bbd7699

2. **Settings → Source:**
   - Если есть старый source - отключить
   - **Connect GitHub Repo**
   - Выбрать: `jumuslim10-lab/taskx-bot`
   - Ветка: `main`

3. **Settings → Variables → Raw Editor:**
   Вставить все переменные:
   ```
   BOT_TOKEN=8666914335:AAGnN7l7lUUPeiFnTqHzmq4GCBwqK9zGip8
   SUPABASE_URL=https://hjoosjstmginrpatkvbm.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb29zanN0bWdpbnJwYXRrdmJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3NTI5MywiZXhwIjoyMTA1NjUxMjkzfQ.wuMdC1ZsckIUB5PKjRdNH1vaJLSaRxjzevBxay2DbBI
   ADMIN_IDS=5819052050
   NODE_ENV=production
   ```

4. **Deploy Settings:**
   - Build Command: (оставить пустым)
   - Start Command: `node main-bot.js` (должно быть автоматически из Procfile)

5. **Save и Deploy!**

---

### Способ 2: Через Railway CLI (если авторизуетесь)

```bash
cd /c/Users/User/Desktop/taskx-railway

# Link to project
railway link 398ee4a3-886e-4fa4-96d4-f2f76bbd7699

# Add variables
railway variables set BOT_TOKEN=8666914335:AAGnN7l7lUUPeiFnTqHzmq4GCBwqK9zGip8
railway variables set SUPABASE_URL=https://hjoosjstmginrpatkvbm.supabase.co
railway variables set SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set ADMIN_IDS=5819052050
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## 🗑️ Старый проект (d2536156-bb46-4bcf-a463-4dd88210b132)

**Нужно ли удалить?**
- ✅ Да, если хотите избежать путаницы
- ✅ Да, если он занимает лимит Railway (обычно 2 проекта бесплатно)
- ⚠️ Или просто остановите его (Settings → Stop Service)

**Как удалить:**
1. Зайти: https://railway.app/project/d2536156-bb46-4bcf-a463-4dd88210b132
2. Settings → Danger Zone → Delete Project

---

## 📊 После настройки проверить:

1. **Deployments** - статус деплоя
2. **Logs** - должно быть:
   ```
   🤖 TaskX Main Bot запущен!
   💾 База данных: Supabase PostgreSQL
   👨‍💼 Админов: 1
   ```
3. **Telegram бот** - отправить `/start`

---

## 🎉 Готово!

Сейчас идите на https://railway.app/project/398ee4a3-886e-4fa4-96d4-f2f76bbd7699 и подключите GitHub репозиторий!
