# TaskX Bot

Unified Telegram bot for TaskX marketplace platform with escrow payments.

## Features

- ✅ Task creation and management
- ✅ Escrow payment system (30% platform fee)
- ✅ User wallet and transactions
- ✅ Support system (feedback, complaints, appeals)
- ✅ Admin panel
- ✅ Complete task workflow: /take → /complete → /confirm
- ✅ Dispute resolution

## Tech Stack

- Node.js
- Telegram Bot API
- Supabase (PostgreSQL)

## Deployment

Deployed on Railway: https://railway.app

## Environment Variables

Required variables:
- `BOT_TOKEN` - Telegram bot token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `ADMIN_IDS` - Comma-separated admin Telegram IDs

## Commands

**User:**
- `/start` - Start bot
- `/menu` - Main menu
- `/take TASK_ID` - Accept task
- `/complete TASK_ID` - Complete task
- `/confirm TASK_ID` - Confirm completion
- `/dispute TASK_ID` - Open dispute
- `/deposit` - Deposit funds
- `/withdraw` - Withdraw funds
- `/help` - Help

**Admin:**
- `/approve USER_ID AMOUNT` - Approve deposit

## License

MIT
