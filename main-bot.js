require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN || '8666914335:AAGnN7l7lUUPeiFnTqHzmq4GCBwqK9zGip8';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hjoosjstmginrpatkvbm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb29zanN0bWdpbnJwYXRrdmJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3NTI5MywiZXhwIjoyMTA1NjUxMjkzfQ.wuMdC1ZsckIUB5PKjRdNH1vaJLSaRxjzevBxay2DbBI';
const ADMIN_IDS = ['5819052050'];
const PLATFORM_FEE_PERCENT = 0.30;
const AUTO_COMPLETE_HOURS = 24;

// ============================================================================
// DATABASE
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getOrCreateUser(telegramId, firstName) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existingUser) return existingUser;

  const username = `User_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      public_username: username,
      first_name: firstName || 'User',
      balance: 1000.00,
      frozen_balance: 0,
      completed_tasks: 0,
      rating: 5.0
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`✅ Новый пользователь: ${newUser.public_username}`);
  return newUser;
}

function calculateFees(price) {
  const platformFee = price * PLATFORM_FEE_PERCENT;
  const executorPayout = price - platformFee;
  return { price, platformFee, executorPayout };
}

function isAdmin(telegramId) {
  return ADMIN_IDS.includes(telegramId.toString());
}

// ============================================================================
// BOT SETUP
// ============================================================================

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// State management
const userStates = new Map();
const supportStates = new Map();

// ============================================================================
// MAIN COMMANDS
// ============================================================================

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const firstName = msg.from?.first_name || 'User';

  try {
    const user = await getOrCreateUser(telegramId, firstName);

    await bot.sendMessage(
      chatId,
      `👋 Добро пожаловать в TaskX, ${firstName}!\n\n` +
      `🎯 <b>TaskX</b> — платформа микрозаданий с безопасными платежами\n\n` +
      `💼 Создавайте задания и получайте помощь\n` +
      `💰 Выполняйте задания и зарабатывайте\n` +
      `🔒 Escrow защита (30% комиссия платформы)\n\n` +
      `<b>Ваш профиль:</b>\n` +
      `🆔 ${user.public_username}\n` +
      `💵 Баланс: ${user.balance} сом\n` +
      `⭐ Рейтинг: ${user.rating}\n\n` +
      `Используйте /menu для навигации`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Error in /start:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при регистрации. Попробуйте позже.');
  }
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔍 Найти задания', callback_data: 'tasks' }],
        [{ text: '➕ Создать задание', callback_data: 'create' }],
        [{ text: '📝 Мои задания', callback_data: 'my_tasks' }],
        [{ text: '💰 Кошелёк', callback_data: 'wallet' }],
        [{ text: '👤 Профиль', callback_data: 'profile' }],
        [{ text: '📞 Поддержка', callback_data: 'support' }],
      ]
    };

    if (isAdmin(telegramId)) {
      keyboard.inline_keyboard.push([{ text: '👨‍💼 Админ-панель', callback_data: 'admin' }]);
    }

    await bot.sendMessage(
      chatId,
      `📋 <b>Главное меню TaskX</b>\n\n` +
      `💵 Баланс: ${user.balance} сом\n` +
      `🔒 Заморожено: ${user.frozen_balance} сом\n\n` +
      `Выберите действие:`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    );
  } catch (error) {
    console.error('Error in /menu:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при загрузке меню.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `📖 <b>Помощь TaskX</b>\n\n` +
    `<b>Основные команды:</b>\n` +
    `/start - Начать работу\n` +
    `/menu - Главное меню\n` +
    `/take TASK_ID - Принять задание\n` +
    `/complete TASK_ID - Завершить задание\n` +
    `/confirm TASK_ID - Подтвердить выполнение\n` +
    `/dispute TASK_ID - Открыть спор\n` +
    `/deposit - Пополнить баланс\n` +
    `/withdraw - Вывести средства\n` +
    `/help - Помощь\n\n` +
    `<b>Как работает escrow:</b>\n` +
    `1️⃣ Заказчик создаёт задание (100 сом)\n` +
    `2️⃣ Деньги резервируются (escrow)\n` +
    `3️⃣ Исполнитель принимает задание (/take TASK_ID)\n` +
    `4️⃣ После выполнения отправляет результат (/complete TASK_ID)\n` +
    `5️⃣ Заказчик подтверждает (/confirm TASK_ID)\n` +
    `6️⃣ Распределение: 70 сом → исполнитель, 30 сом → платформа\n\n` +
    `⚡️ Если заказчик не ответит в течение ${AUTO_COMPLETE_HOURS} часов,\n` +
    `задание автоматически завершится.\n\n` +
    `<b>Безопасность:</b>\n` +
    `✅ Escrow защита\n` +
    `✅ Анонимность пользователей\n` +
    `✅ База данных Supabase`,
    { parse_mode: 'HTML' }
  );
});

// ============================================================================
// CALLBACK HANDLERS
// ============================================================================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id.toString();
  const data = query.data;

  try {
    const user = await getOrCreateUser(telegramId, query.from?.first_name);

    // ========== MAIN MENU ==========
    if (data === 'tasks') {
      await handleTasks(chatId, user);
    } else if (data === 'create') {
      await handleCreateTask(chatId, telegramId);
    } else if (data === 'my_tasks') {
      await handleMyTasks(chatId, user);
    } else if (data === 'wallet') {
      await handleWallet(chatId, user);
    } else if (data === 'transactions') {
      await handleTransactions(chatId, user);
    } else if (data === 'deposit') {
      await handleDeposit(chatId, user);
    } else if (data === 'withdraw') {
      await handleWithdraw(chatId, user);
    } else if (data === 'profile') {
      await handleProfile(chatId, user);
    } else if (data === 'support') {
      await handleSupport(chatId, telegramId);
    } else if (data === 'admin' && isAdmin(telegramId)) {
      await handleAdmin(chatId);
    } else if (data === 'back_main') {
      await bot.sendMessage(chatId, '/menu');
    }

    // ========== SUPPORT ==========
    else if (['feedback', 'suggestion', 'complaint', 'appeal'].includes(data)) {
      await handleSupportCategory(chatId, telegramId, data);
    } else if (data === 'my_tickets') {
      await handleMyTickets(chatId, telegramId);
    }

    // ========== ADMIN ==========
    else if (data === 'admin_stats' && isAdmin(telegramId)) {
      await handleAdminStats(chatId);
    } else if (data === 'admin_tasks' && isAdmin(telegramId)) {
      await handleAdminTasks(chatId);
    } else if (data === 'admin_users' && isAdmin(telegramId)) {
      await handleAdminUsers(chatId);
    } else if (data === 'admin_support' && isAdmin(telegramId)) {
      await handleAdminSupport(chatId);
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error in callback_query:', error);
    await bot.answerCallbackQuery(query.id, { text: '❌ Ошибка' });
  }
});

// ============================================================================
// HANDLERS - MAIN MENU
// ============================================================================

async function handleTasks(chatId, user) {
  const { data: availableTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'PUBLISHED')
    .neq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  let message;
  if (!availableTasks || availableTasks.length === 0) {
    message = `🔍 <b>Доступные задания</b>\n\n` +
             `Пока нет доступных заданий.\n` +
             `Создайте первое задание через /menu → Создать задание`;
  } else {
    message = `🔍 <b>Доступные задания</b>\n\n`;
    availableTasks.forEach((task, i) => {
      message += `${i + 1}️⃣ <b>${task.title}</b>\n` +
                `💰 ${task.price} сом (вы получите ${task.executor_payout} сом)\n` +
                `📋 ${task.description}\n` +
                `🆔 ${task.public_id}\n\n`;
    });
    message += `<i>Комиссия платформы: 30%</i>\n\n` +
              `Чтобы принять задание:\n/take TASK_ID`;
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleCreateTask(chatId, telegramId) {
  userStates.set(telegramId, { step: 'title', action: 'create_task' });
  await bot.sendMessage(
    chatId,
    `➕ <b>Создать задание - Шаг 1/3</b>\n\n` +
    `📝 Напишите название задания:\n\n` +
    `Пример: "Купить сендвич" или "Доставить документы"`,
    { parse_mode: 'HTML' }
  );
}

async function handleMyTasks(chatId, user) {
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('*')
    .or(`client_id.eq.${user.id},executor_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(10);

  let message = `📝 <b>Мои задания</b>\n\n` +
               `Выполнено: ${user.completed_tasks}\n\n`;

  if (!myTasks || myTasks.length === 0) {
    message += `У вас пока нет заданий`;
  } else {
    myTasks.forEach(task => {
      const role = task.client_id === user.id ? '📤 Заказчик' : '📥 Исполнитель';
      const statusEmoji = {
        'PUBLISHED': '🟢',
        'IN_PROGRESS': '🟡',
        'PENDING_CONFIRMATION': '⏳',
        'COMPLETED': '✅',
        'CANCELLED': '❌',
        'DISPUTED': '⚠️'
      }[task.status] || '❓';

      message += `${role} ${statusEmoji} <b>${task.title}</b>\n` +
                `💰 ${task.price} сом | ${task.status}\n` +
                `🆔 ${task.public_id}\n\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleWallet(chatId, user) {
  await bot.sendMessage(
    chatId,
    `💰 <b>Кошелёк</b>\n\n` +
    `💵 Доступно: ${user.balance} сом\n` +
    `🔒 Заморожено: ${user.frozen_balance} сом\n\n` +
    `Выберите действие:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 История транзакций', callback_data: 'transactions' }],
          [{ text: '💳 Пополнить баланс', callback_data: 'deposit' }],
          [{ text: '💸 Вывести средства', callback_data: 'withdraw' }],
          [{ text: '🔙 Назад', callback_data: 'back_main' }],
        ]
      }
    }
  );
}

async function handleTransactions(chatId, user) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  let message = `📊 <b>История транзакций</b>\n\n` +
               `💵 Доступно: ${user.balance} сом\n` +
               `🔒 Заморожено: ${user.frozen_balance} сом\n\n`;

  if (!transactions || transactions.length === 0) {
    message += `Транзакций пока нет`;
  } else {
    transactions.forEach(tx => {
      const sign = tx.amount > 0 ? '+' : '';
      const typeEmoji = {
        'DEPOSIT': '💳',
        'WITHDRAW': '💸',
        'ESCROW_LOCK': '🔒',
        'PAYOUT': '✅',
        'PLATFORM_FEE': '🏦',
        'REFUND': '↩️'
      }[tx.type] || '💰';

      const date = new Date(tx.created_at).toLocaleString('ru', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      message += `${typeEmoji} ${sign}${tx.amount} сом\n`;
      if (tx.description) {
        message += `📝 ${tx.description}\n`;
      }
      message += `🕐 ${date}\n\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleDeposit(chatId, user) {
  await bot.sendMessage(
    chatId,
    `💳 <b>Пополнение баланса</b>\n\n` +
    `💵 Текущий баланс: ${user.balance} сом\n\n` +
    `📸 Отправьте скриншот чека после оплаты\n` +
    `Администратор проверит и зачислит средства\n\n` +
    `<i>Обычно это занимает 5-15 минут</i>`,
    { parse_mode: 'HTML' }
  );

  userStates.set(user.telegram_id, { action: 'deposit_screenshot' });
}

async function handleWithdraw(chatId, user) {
  if (parseFloat(user.balance) < 100) {
    await bot.sendMessage(
      chatId,
      `❌ Минимальная сумма для вывода: 100 сом\n` +
      `💵 Ваш баланс: ${user.balance} сом`
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    `💸 <b>Вывод средств</b>\n\n` +
    `💵 Доступно: ${user.balance} сом\n\n` +
    `Напишите сумму и реквизиты:\n` +
    `Пример: "500 +996555123456 MBank"\n\n` +
    `Минимум: 100 сом`,
    { parse_mode: 'HTML' }
  );

  userStates.set(user.telegram_id, { action: 'withdraw_request' });
}

async function handleProfile(chatId, user) {
  await bot.sendMessage(
    chatId,
    `👤 <b>Профиль</b>\n\n` +
    `🆔 ${user.public_username}\n` +
    `⭐ Рейтинг: ${user.rating}\n` +
    `✅ Выполнено: ${user.completed_tasks} заданий\n` +
    `💵 Баланс: ${user.balance} сом\n` +
    `🔒 Заморожено: ${user.frozen_balance} сом\n\n` +
    `<i>Ваш Telegram ID скрыт для анонимности</i>`,
    { parse_mode: 'HTML' }
  );
}

// ============================================================================
// HANDLERS - SUPPORT
// ============================================================================

async function handleSupport(chatId, telegramId) {
  await bot.sendMessage(
    chatId,
    `📞 <b>Центр поддержки TaskX</b>\n\n` +
    `Здесь вы можете:\n` +
    `💬 Оставить отзыв о платформе\n` +
    `💡 Предложить улучшение\n` +
    `⚠️ Пожаловаться на пользователя/задание\n` +
    `⚖️ Подать апелляцию по спору\n\n` +
    `Выберите категорию обращения:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⭐ Отзыв', callback_data: 'feedback' }],
          [{ text: '💡 Предложение', callback_data: 'suggestion' }],
          [{ text: '⚠️ Жалоба', callback_data: 'complaint' }],
          [{ text: '⚖️ Апелляция', callback_data: 'appeal' }],
          [{ text: '📋 Мои обращения', callback_data: 'my_tickets' }],
          [{ text: '🔙 Назад', callback_data: 'back_main' }],
        ]
      }
    }
  );
}

async function handleSupportCategory(chatId, telegramId, category) {
  const categoryNames = {
    feedback: 'отзыв',
    suggestion: 'предложение',
    complaint: 'жалобу',
    appeal: 'апелляцию'
  };

  supportStates.set(telegramId, {
    category,
    step: ['complaint', 'appeal'].includes(category) ? 'task_id' : 'subject'
  });

  let message;
  if (['complaint', 'appeal'].includes(category)) {
    message = `⚠️ <b>Создание обращения: ${categoryNames[category]}</b>\n\n` +
             `Укажите ID задания (формат: TASK-XXXXX):\n\n` +
             `Пример: TASK-MUCR5N7J`;
  } else {
    message = `📝 <b>Создание обращения: ${categoryNames[category]}</b>\n\n` +
             `Напишите краткую тему обращения:\n\n` +
             `Пример: "Отличная платформа!" или "Добавьте фильтры в поиск"`;
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleMyTickets(chatId, telegramId) {
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_telegram_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(10);

  let message = `📋 <b>Ваши обращения:</b>\n\n`;

  if (!tickets || tickets.length === 0) {
    message += `У вас пока нет обращений`;
  } else {
    tickets.forEach(ticket => {
      const statusEmoji = {
        open: '🟢',
        in_progress: '🟡',
        resolved: '✅',
        closed: '⚫'
      }[ticket.status] || '❓';

      const categoryName = {
        feedback: 'Отзыв',
        suggestion: 'Предложение',
        complaint: 'Жалоба',
        appeal: 'Апелляция'
      }[ticket.category];

      message += `${statusEmoji} <b>${categoryName}</b>\n`;
      message += `🆔 ${ticket.ticket_id}\n`;
      if (ticket.subject) message += `📝 ${ticket.subject}\n`;
      message += `Статус: ${ticket.status}\n`;
      if (ticket.admin_response) {
        message += `✅ Ответ: ${ticket.admin_response}\n`;
      }
      message += `\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

// ============================================================================
// HANDLERS - ADMIN
// ============================================================================

async function handleAdmin(chatId) {
  await bot.sendMessage(
    chatId,
    `👨‍💼 <b>Админ-панель TaskX</b>\n\n` +
    `Выберите раздел:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
          [{ text: '📋 Задания', callback_data: 'admin_tasks' }],
          [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
          [{ text: '📞 Поддержка', callback_data: 'admin_support' }],
          [{ text: '🔙 Назад', callback_data: 'back_main' }],
        ]
      }
    }
  );
}

async function handleAdminStats(chatId) {
  const [users, tasks, transactions, tickets] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true })
  ]);

  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('status', ['PUBLISHED', 'IN_PROGRESS']);

  const message =
    `📊 <b>Статистика платформы</b>\n\n` +
    `👥 Пользователей: ${users.count || 0}\n` +
    `📋 Всего заданий: ${tasks.count || 0}\n` +
    `📋 Активных: ${activeTasks.count || 0}\n` +
    `💰 Транзакций: ${transactions.count || 0}\n` +
    `📞 Обращений: ${tickets.count || 0}\n\n` +
    `📅 ${new Date().toLocaleString('ru')}`;

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleAdminTasks(chatId) {
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  let message = `📋 <b>Последние задания:</b>\n\n`;

  if (!recentTasks || recentTasks.length === 0) {
    message += `Заданий пока нет`;
  } else {
    recentTasks.forEach(task => {
      message += `🆔 ${task.public_id}\n`;
      message += `📝 ${task.title}\n`;
      message += `💰 ${task.price} сом | ${task.status}\n\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleAdminUsers(chatId) {
  const { data: recentUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  let message = `👥 <b>Последние пользователи:</b>\n\n`;

  if (!recentUsers || recentUsers.length === 0) {
    message += `Пользователей пока нет`;
  } else {
    recentUsers.forEach(user => {
      message += `🆔 ${user.public_username}\n`;
      message += `💵 Баланс: ${user.balance} сом\n`;
      message += `⭐ Рейтинг: ${user.rating}\n\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function handleAdminSupport(chatId) {
  const { data: openTickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);

  let message = `📞 <b>Открытые обращения:</b>\n\n`;

  if (!openTickets || openTickets.length === 0) {
    message += `Новых обращений нет`;
  } else {
    openTickets.forEach(ticket => {
      const categoryEmoji = {
        feedback: '⭐',
        suggestion: '💡',
        complaint: '⚠️',
        appeal: '⚖️'
      }[ticket.category] || '📝';

      message += `${categoryEmoji} ${ticket.ticket_id}\n`;
      message += `👤 ${ticket.user_name}\n`;
      message += `📝 ${ticket.subject}\n\n`;
    });
  }

  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const text = msg.text;

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);
    const state = userStates.get(telegramId);
    const supportState = supportStates.get(telegramId);

    // Handle task creation
    if (state?.action === 'create_task') {
      await handleTaskCreationFlow(chatId, telegramId, user, state, text);
    }

    // Handle deposit screenshot
    else if (state?.action === 'deposit_screenshot' && msg.photo) {
      await handleDepositScreenshot(chatId, telegramId, user, msg.photo);
    }

    // Handle withdraw request
    else if (state?.action === 'withdraw_request') {
      await handleWithdrawRequest(chatId, telegramId, user, text);
    }

    // Handle support ticket creation
    else if (supportState) {
      await handleSupportFlow(chatId, telegramId, user, supportState, text);
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    await bot.sendMessage(chatId, '❌ Ошибка обработки сообщения');
  }
});

// Handle photo messages (deposit screenshots)
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const state = userStates.get(telegramId);

  if (state?.action === 'deposit_screenshot') {
    try {
      const user = await getOrCreateUser(telegramId, msg.from?.first_name);
      const photoId = msg.photo[msg.photo.length - 1].file_id;

      await bot.sendMessage(
        chatId,
        `✅ <b>Скриншот получен!</b>\n\n` +
        `Ваша заявка на пополнение отправлена администратору\n` +
        `Ожидайте подтверждения (обычно 5-15 минут)\n\n` +
        `📲 Мы уведомим вас, когда средства поступят на баланс`,
        { parse_mode: 'HTML' }
      );

      // Notify admin
      for (const adminId of ADMIN_IDS) {
        await bot.sendPhoto(adminId, photoId, {
          caption:
            `💰 <b>Новая заявка на пополнение</b>\n\n` +
            `👤 Пользователь: ${user.public_username}\n` +
            `🆔 User ID: ${user.id}\n` +
            `📱 Telegram ID: ${telegramId}\n\n` +
            `Для зачисления используйте:\n` +
            `/approve ${user.id} СУММА`,
          parse_mode: 'HTML'
        });
      }

      userStates.delete(telegramId);
    } catch (error) {
      console.error('Error handling deposit screenshot:', error);
      await bot.sendMessage(chatId, '❌ Ошибка при отправке заявки');
    }
  }
});

// ============================================================================
// TASK FLOW HANDLERS
// ============================================================================

async function handleTaskCreationFlow(chatId, telegramId, user, state, text) {
  if (state.step === 'title') {
    state.title = text;
    state.step = 'description';
    userStates.set(telegramId, state);

    await bot.sendMessage(
      chatId,
      `➕ <b>Создать задание - Шаг 2/3</b>\n\n` +
      `📋 Напишите описание задания:\n\n` +
      `Пример: "Купить сендвич в магазине X на улице Y и доставить по адресу Z"`,
      { parse_mode: 'HTML' }
    );
  } else if (state.step === 'description') {
    state.description = text;
    state.step = 'price';
    userStates.set(telegramId, state);

    await bot.sendMessage(
      chatId,
      `➕ <b>Создать задание - Шаг 3/3</b>\n\n` +
      `💰 Напишите цену задания (в сомах):\n\n` +
      `Минимум: 50 сом\n` +
      `Пример: 100`,
      { parse_mode: 'HTML' }
    );
  } else if (state.step === 'price') {
    const price = parseFloat(text);

    if (isNaN(price) || price < 50) {
      return bot.sendMessage(chatId, '❌ Цена должна быть числом и не менее 50 сом. Попробуйте ещё раз:');
    }

    if (parseFloat(user.balance) < price) {
      userStates.delete(telegramId);
      return bot.sendMessage(chatId, `❌ Недостаточно средств. Баланс: ${user.balance} сом, требуется: ${price} сом`);
    }

    const fees = calculateFees(price);
    const publicId = `TASK-${Date.now().toString(36).toUpperCase()}`;

    // Create task
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        public_id: publicId,
        client_id: user.id,
        title: state.title,
        description: state.description,
        price: fees.price,
        executor_payout: fees.executorPayout,
        platform_fee: fees.platformFee,
        status: 'PUBLISHED'
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Update user balance
    await supabase
      .from('users')
      .update({
        balance: parseFloat(user.balance) - price,
        frozen_balance: parseFloat(user.frozen_balance) + price
      })
      .eq('id', user.id);

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'ESCROW_LOCK',
      amount: -price,
      task_id: newTask.id,
      description: `Резервирование для задания ${publicId}`
    });

    userStates.delete(telegramId);

    await bot.sendMessage(
      chatId,
      `✅ <b>Задание создано!</b>\n\n` +
      `📋 ${state.title}\n` +
      `💰 Цена: ${price} сом\n` +
      `💵 Исполнитель получит: ${fees.executorPayout.toFixed(2)} сом\n` +
      `🏦 Комиссия платформы: ${fees.platformFee.toFixed(2)} сом (30%)\n` +
      `🔒 Средства зарезервированы\n\n` +
      `🆔 ${publicId}\n\n` +
      `Задание опубликовано и доступно для исполнителей!`,
      { parse_mode: 'HTML' }
    );

    console.log(`📋 Создано задание: ${publicId} от ${user.public_username}`);
  }
}

async function handleSupportFlow(chatId, telegramId, user, state, text) {
  if (state.step === 'task_id') {
    if (!text.startsWith('TASK-')) {
      return bot.sendMessage(chatId, '❌ Неверный формат. ID задания должен начинаться с TASK-\nПример: TASK-MUCR5N7J');
    }

    state.related_task_id = text;
    state.step = 'subject';
    supportStates.set(telegramId, state);

    await bot.sendMessage(
      chatId,
      `📝 Напишите краткую тему обращения:\n\n` +
      `Пример: "Мошенничество" или "Несправедливое решение"`,
      { parse_mode: 'HTML' }
    );
  } else if (state.step === 'subject') {
    state.subject = text;
    state.step = 'message';
    supportStates.set(telegramId, state);

    await bot.sendMessage(
      chatId,
      `📝 Напишите подробное описание:\n\n` +
      `Опишите ситуацию максимально подробно.`,
      { parse_mode: 'HTML' }
    );
  } else if (state.step === 'message') {
    const ticketId = `TICKET-${Date.now().toString(36).toUpperCase()}`;

    await supabase.from('support_tickets').insert({
      ticket_id: ticketId,
      user_telegram_id: telegramId,
      user_name: user.first_name || user.public_username,
      category: state.category,
      subject: state.subject,
      message: text,
      related_task_id: state.related_task_id || null,
      status: 'open'
    });

    supportStates.delete(telegramId);

    const categoryName = {
      feedback: 'Отзыв',
      suggestion: 'Предложение',
      complaint: 'Жалоба',
      appeal: 'Апелляция'
    }[state.category];

    await bot.sendMessage(
      chatId,
      `✅ <b>Обращение создано!</b>\n\n` +
      `📋 Тип: ${categoryName}\n` +
      `🆔 ${ticketId}\n` +
      `📝 Тема: ${state.subject}\n\n` +
      `Ваше обращение передано администрации.\n` +
      `Мы свяжемся с вами в ближайшее время.`,
      { parse_mode: 'HTML' }
    );

    console.log(`📩 Новое обращение: ${ticketId} (${state.category}) от ${user.public_username}`);
  }
}

async function handleDepositScreenshot(chatId, telegramId, user, photos) {
  const photoId = photos[photos.length - 1].file_id;

  await bot.sendMessage(
    chatId,
    `✅ <b>Скриншот получен!</b>\n\n` +
    `Ваша заявка на пополнение отправлена администратору\n` +
    `Ожидайте подтверждения (обычно 5-15 минут)\n\n` +
    `📲 Мы уведомим вас, когда средства поступят на баланс`,
    { parse_mode: 'HTML' }
  );

  // Notify admins
  for (const adminId of ADMIN_IDS) {
    await bot.sendPhoto(adminId, photoId, {
      caption:
        `💰 <b>Новая заявка на пополнение</b>\n\n` +
        `👤 ${user.public_username}\n` +
        `🆔 User ID: ${user.id}\n` +
        `📱 Telegram: ${telegramId}\n\n` +
        `Для зачисления:\n/approve ${user.id} СУММА`,
      parse_mode: 'HTML'
    });
  }

  userStates.delete(telegramId);
}

async function handleWithdrawRequest(chatId, telegramId, user, text) {
  userStates.delete(telegramId);

  await bot.sendMessage(
    chatId,
    `✅ <b>Заявка на вывод получена!</b>\n\n` +
    `📝 Реквизиты: ${text}\n\n` +
    `Ваша заявка отправлена администратору\n` +
    `Обработка обычно занимает до 24 часов`,
    { parse_mode: 'HTML' }
  );

  // Notify admins
  for (const adminId of ADMIN_IDS) {
    await bot.sendMessage(
      adminId,
      `💸 <b>Новая заявка на вывод</b>\n\n` +
      `👤 ${user.public_username}\n` +
      `🆔 User ID: ${user.id}\n` +
      `💵 Баланс: ${user.balance} сом\n` +
      `📝 Реквизиты:\n${text}`,
      { parse_mode: 'HTML' }
    );
  }
}

// ============================================================================
// TASK COMMANDS - /take, /complete, /confirm, /dispute
// ============================================================================

bot.onText(/\/take (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const taskId = match[1];

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_id', taskId)
      .eq('status', 'PUBLISHED')
      .single();

    if (!task) {
      return bot.sendMessage(chatId, '❌ Задание не найдено или уже выполняется');
    }

    if (task.client_id === user.id) {
      return bot.sendMessage(chatId, '❌ Вы не можете принять своё задание');
    }

    await supabase
      .from('tasks')
      .update({
        executor_id: user.id,
        status: 'IN_PROGRESS'
      })
      .eq('id', task.id);

    await bot.sendMessage(
      chatId,
      `✅ <b>Задание принято!</b>\n\n` +
      `📋 ${task.title}\n` +
      `📝 ${task.description}\n` +
      `💰 Вы получите: ${task.executor_payout} сом\n\n` +
      `После выполнения используйте:\n/complete ${taskId}`,
      { parse_mode: 'HTML' }
    );

    // Notify client
    const { data: client } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', task.client_id)
      .single();

    if (client) {
      await bot.sendMessage(
        client.telegram_id,
        `👷 <b>Задание взято в работу!</b>\n\n` +
        `📋 ${task.title}\n` +
        `Исполнитель: ${user.public_username}`,
        { parse_mode: 'HTML' }
      );
    }

    console.log(`✅ Задание ${taskId} принято: ${user.public_username}`);
  } catch (error) {
    console.error('Error in /take:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при принятии задания');
  }
});

bot.onText(/\/complete (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const taskId = match[1];

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_id', taskId)
      .eq('executor_id', user.id)
      .eq('status', 'IN_PROGRESS')
      .single();

    if (!task) {
      return bot.sendMessage(chatId, '❌ Задание не найдено или вы не исполнитель');
    }

    await supabase
      .from('tasks')
      .update({ status: 'PENDING_CONFIRMATION' })
      .eq('id', task.id);

    await bot.sendMessage(
      chatId,
      `✅ <b>Задание отправлено на проверку!</b>\n\n` +
      `Ожидайте подтверждения от заказчика\n` +
      `После подтверждения средства поступят на баланс`,
      { parse_mode: 'HTML' }
    );

    // Notify client
    const { data: client } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', task.client_id)
      .single();

    if (client) {
      await bot.sendMessage(
        client.telegram_id,
        `✅ <b>Задание выполнено!</b>\n\n` +
        `📋 ${task.title}\n` +
        `Исполнитель: ${user.public_username}\n\n` +
        `Для подтверждения используйте:\n/confirm ${taskId}`,
        { parse_mode: 'HTML' }
      );
    }

    console.log(`✅ Задание ${taskId} завершено: ${user.public_username}`);
  } catch (error) {
    console.error('Error in /complete:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при завершении задания');
  }
});

bot.onText(/\/confirm (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const taskId = match[1];

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_id', taskId)
      .eq('client_id', user.id)
      .eq('status', 'PENDING_CONFIRMATION')
      .single();

    if (!task) {
      return bot.sendMessage(chatId, '❌ Задание не найдено или вы не заказчик');
    }

    // Release frozen balance from client
    await supabase
      .from('users')
      .update({
        frozen_balance: parseFloat(user.frozen_balance) - parseFloat(task.price)
      })
      .eq('id', task.client_id);

    // Pay executor
    const { data: executor } = await supabase
      .from('users')
      .select('*')
      .eq('id', task.executor_id)
      .single();

    await supabase
      .from('users')
      .update({
        balance: parseFloat(executor.balance) + parseFloat(task.executor_payout),
        completed_tasks: executor.completed_tasks + 1
      })
      .eq('id', task.executor_id);

    // Update task status
    await supabase
      .from('tasks')
      .update({ status: 'COMPLETED' })
      .eq('id', task.id);

    // Create transactions
    await supabase.from('transactions').insert([
      {
        user_id: task.executor_id,
        type: 'PAYOUT',
        amount: task.executor_payout,
        task_id: task.id,
        description: `Выплата за задание ${taskId}`
      },
      {
        user_id: task.client_id,
        type: 'PLATFORM_FEE',
        amount: -task.platform_fee,
        task_id: task.id,
        description: `Комиссия платформы за задание ${taskId}`
      }
    ]);

    await bot.sendMessage(
      chatId,
      `✅ <b>Задание завершено!</b>\n\n` +
      `💰 Исполнителю выплачено: ${task.executor_payout} сом\n` +
      `🏦 Комиссия платформы: ${task.platform_fee} сом`,
      { parse_mode: 'HTML' }
    );

    // Notify executor
    await bot.sendMessage(
      executor.telegram_id,
      `💰 <b>Выплата получена!</b>\n\n` +
      `📋 Задание: ${task.title}\n` +
      `💵 Выплата: ${task.executor_payout} сом\n` +
      `💳 Новый баланс: ${parseFloat(executor.balance) + parseFloat(task.executor_payout)} сом`,
      { parse_mode: 'HTML' }
    );

    console.log(`💰 Задание ${taskId} оплачено: ${task.executor_payout} сом → ${executor.public_username}`);
  } catch (error) {
    console.error('Error in /confirm:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при подтверждении задания');
  }
});

bot.onText(/\/dispute (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const taskId = match[1];

  try {
    const user = await getOrCreateUser(telegramId, msg.from?.first_name);

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_id', taskId)
      .single();

    if (!task) {
      return bot.sendMessage(chatId, '❌ Задание не найдено');
    }

    if (task.client_id !== user.id && task.executor_id !== user.id) {
      return bot.sendMessage(chatId, '❌ Вы не участвуете в этом задании');
    }

    await supabase
      .from('tasks')
      .update({ status: 'DISPUTED' })
      .eq('id', task.id);

    await bot.sendMessage(
      chatId,
      `⚠️ <b>Спор открыт!</b>\n\n` +
      `📋 Задание: ${task.title}\n` +
      `🆔 ${taskId}\n\n` +
      `Администрация рассмотрит спор и примет решение.\n` +
      `Обычно это занимает 24-48 часов.`,
      { parse_mode: 'HTML' }
    );

    // Notify admins
    for (const adminId of ADMIN_IDS) {
      await bot.sendMessage(
        adminId,
        `⚠️ <b>НОВЫЙ СПОР</b>\n\n` +
        `📋 Задание: ${task.title}\n` +
        `🆔 ${taskId}\n` +
        `👤 Инициатор: ${user.public_username}\n` +
        `💰 Сумма: ${task.price} сом`,
        { parse_mode: 'HTML' }
      );
    }

    console.log(`⚠️ Спор открыт: ${taskId} от ${user.public_username}`);
  } catch (error) {
    console.error('Error in /dispute:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при открытии спора');
  }
});

// ============================================================================
// ADMIN COMMANDS
// ============================================================================

bot.onText(/\/approve (\d+) ([\d.]+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  if (!isAdmin(telegramId)) {
    return bot.sendMessage(chatId, '❌ У вас нет прав администратора');
  }

  const userId = parseInt(match[1]);
  const amount = parseFloat(match[2]);

  if (isNaN(userId) || isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId, '❌ Неверный формат. Используйте: /approve USER_ID СУММА');
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return bot.sendMessage(chatId, '❌ Пользователь не найден');
    }

    // Update balance
    await supabase
      .from('users')
      .update({
        balance: parseFloat(user.balance) + amount
      })
      .eq('id', userId);

    // Create transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'DEPOSIT',
      amount: amount,
      description: `Пополнение баланса администратором`
    });

    await bot.sendMessage(chatId, `✅ Баланс пользователя ${user.public_username} пополнен на ${amount} сом`);

    // Notify user
    await bot.sendMessage(
      user.telegram_id,
      `✅ <b>Баланс пополнен!</b>\n\n` +
      `💰 Зачислено: ${amount} сом\n` +
      `💵 Новый баланс: ${parseFloat(user.balance) + amount} сом\n\n` +
      `Теперь вы можете создавать задания!`,
      { parse_mode: 'HTML' }
    );

    console.log(`💰 Админ пополнение: ${amount} сом → ${user.public_username}`);
  } catch (error) {
    console.error('Error in /approve:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при пополнении баланса');
  }
});

// ============================================================================
// START BOT
// ============================================================================

console.log('🤖 TaskX Main Bot запущен!');
console.log('💾 База данных: Supabase PostgreSQL');
console.log('🔗 Project: hjoosjstmginrpatkvbm');
console.log('👨‍💼 Админов:', ADMIN_IDS.length);
console.log('📱 Откройте Telegram и найдите своего бота');
console.log('💬 Отправьте /start\n');
