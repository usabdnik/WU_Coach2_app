#!/bin/bash

# 🚀 Автоматическая настройка GitHub Secrets для CRM синхронизации
# Использование: ./setup-github-secrets.sh

set -e

echo "🔐 Настройка GitHub Secrets для автоматической синхронизации CRM"
echo "================================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Репозиторий
REPO="usabdnik/WU_Coach2_app"

# Проверка установки GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) не установлен${NC}"
    echo ""
    echo "Установите с помощью:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo ""
    echo "После установки запустите скрипт снова."
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI установлен${NC}"

# Проверка авторизации
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Вы не авторизованы в GitHub${NC}"
    echo ""
    echo "Запускаю авторизацию..."
    gh auth login
    echo ""
fi

echo -e "${GREEN}✅ Авторизация в GitHub успешна${NC}"
echo ""

# Сбор данных для секретов
echo "📝 Введите данные для секретов:"
echo "================================"
echo ""

# 1. SUPABASE_URL
echo "1️⃣ SUPABASE_URL"
echo "   По умолчанию: https://mjkssesvhowmncyctmvs.supabase.co"
read -p "   Введите URL (или Enter для значения по умолчанию): " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://mjkssesvhowmncyctmvs.supabase.co}
echo -e "${GREEN}   ✓ Установлено: $SUPABASE_URL${NC}"
echo ""

# 2. SUPABASE_SERVICE_KEY
echo "2️⃣ SUPABASE_SERVICE_KEY"
echo "   Где найти: Supabase Dashboard → Settings → API → service_role key"
read -p "   Введите ключ: " SUPABASE_SERVICE_KEY
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}   ❌ Ключ не может быть пустым${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Ключ получен${NC}"
echo ""

# 3. GOOGLE_SHEETS_ID
echo "3️⃣ GOOGLE_SHEETS_ID"
echo "   Где найти: URL таблицы → /d/{ЭТОТ_ID}/edit"
echo "   Пример: https://docs.google.com/spreadsheets/d/1ABC...xyz/edit"
read -p "   Введите ID таблицы: " GOOGLE_SHEETS_ID
if [ -z "$GOOGLE_SHEETS_ID" ]; then
    echo -e "${RED}   ❌ ID не может быть пустым${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ ID получен${NC}"
echo ""

# 4. GOOGLE_SERVICE_ACCOUNT_EMAIL
echo "4️⃣ GOOGLE_SERVICE_ACCOUNT_EMAIL"
echo "   Где найти: JSON файл сервисного аккаунта → client_email"
echo "   Формат: your-service@your-project.iam.gserviceaccount.com"
read -p "   Введите email: " GOOGLE_SERVICE_ACCOUNT_EMAIL
if [ -z "$GOOGLE_SERVICE_ACCOUNT_EMAIL" ]; then
    echo -e "${RED}   ❌ Email не может быть пустым${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Email получен${NC}"
echo ""

# 5. GOOGLE_PRIVATE_KEY
echo "5️⃣ GOOGLE_PRIVATE_KEY"
echo "   Где найти: JSON файл сервисного аккаунта → private_key"
echo "   ВАЖНО: Скопируйте полностью, включая -----BEGIN PRIVATE KEY-----"
echo ""
echo "   Нажмите Enter и вставьте ключ (Cmd+V на macOS):"
echo "   Для завершения ввода нажмите Ctrl+D"
echo ""
GOOGLE_PRIVATE_KEY=$(cat)
if [ -z "$GOOGLE_PRIVATE_KEY" ]; then
    echo -e "${RED}   ❌ Ключ не может быть пустым${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Ключ получен${NC}"
echo ""

# Добавление секретов в GitHub
echo "🚀 Добавление секретов в GitHub..."
echo "===================================="
echo ""

echo "Добавляю SUPABASE_URL..."
echo "$SUPABASE_URL" | gh secret set SUPABASE_URL --repo $REPO
echo -e "${GREEN}✅ SUPABASE_URL добавлен${NC}"

echo "Добавляю SUPABASE_SERVICE_KEY..."
echo "$SUPABASE_SERVICE_KEY" | gh secret set SUPABASE_SERVICE_KEY --repo $REPO
echo -e "${GREEN}✅ SUPABASE_SERVICE_KEY добавлен${NC}"

echo "Добавляю GOOGLE_SHEETS_ID..."
echo "$GOOGLE_SHEETS_ID" | gh secret set GOOGLE_SHEETS_ID --repo $REPO
echo -e "${GREEN}✅ GOOGLE_SHEETS_ID добавлен${NC}"

echo "Добавляю GOOGLE_SERVICE_ACCOUNT_EMAIL..."
echo "$GOOGLE_SERVICE_ACCOUNT_EMAIL" | gh secret set GOOGLE_SERVICE_ACCOUNT_EMAIL --repo $REPO
echo -e "${GREEN}✅ GOOGLE_SERVICE_ACCOUNT_EMAIL добавлен${NC}"

echo "Добавляю GOOGLE_PRIVATE_KEY..."
echo "$GOOGLE_PRIVATE_KEY" | gh secret set GOOGLE_PRIVATE_KEY --repo $REPO
echo -e "${GREEN}✅ GOOGLE_PRIVATE_KEY добавлен${NC}"

echo ""
echo "================================================================"
echo -e "${GREEN}🎉 ВСЕ СЕКРЕТЫ УСПЕШНО ДОБАВЛЕНЫ!${NC}"
echo "================================================================"
echo ""
echo "✅ Следующие шаги:"
echo "1. Перейдите на: https://github.com/$REPO/actions/workflows/crm-sync.yml"
echo "2. Нажмите 'Run workflow' → выберите 'main' → 'Run workflow'"
echo "3. Дождитесь завершения (~30 секунд)"
echo "4. Проверьте логи - должна быть успешная синхронизация!"
echo ""
echo "⏰ Автоматическая синхронизация будет происходить каждые 15 минут."
echo ""
