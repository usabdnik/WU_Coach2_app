# Диагностика и исправление подключения к Supabase

**Проблема:** `supabase db push` падает с ошибкой:
```
failed to connect to postgres: tls error (read tcp ... connection reset by peer)
```

**Статус:** БЛОКИРУЕТ деплой миграции → БЛОКИРУЕТ весь feature

---

## 🔍 План диагностики и исправления

### 1. Проверка базовой связи

```bash
# Проверка доступности хоста Supabase
ping aws-1-us-east-2.pooler.supabase.com

# Проверка порта PostgreSQL
nc -zv aws-1-us-east-2.pooler.supabase.com 5432

# Проверка DNS
nslookup aws-1-us-east-2.pooler.supabase.com
```

**Ожидаемый результат:** Все команды должны работать без ошибок

---

### 2. Проверка Docker (если требуется для локального Supabase)

```bash
# Проверка статуса Docker
docker info

# Если Docker не запущен:
open -a Docker  # macOS
# Или: sudo systemctl start docker  # Linux

# Проверка локального Supabase
supabase status
```

---

### 3. Проверка конфигурации Supabase CLI

```bash
# Проверка версии CLI
supabase --version

# Проверка конфигурации
cat .env | grep SUPABASE
cat supabase/config.toml | head -20

# Проверка связанных проектов
supabase projects list
```

---

### 4. Альтернативные методы подключения

#### Вариант A: Прямое подключение (без TLS проблем)

```bash
# Установить переменные окружения
export SUPABASE_DB_PASSWORD="ваш_пароль_от_dashboard"
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

# Прямое подключение через psql
psql "postgresql://postgres.mjkssesvhowmncyctmvs:$PGPASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

#### Вариант B: Connection Pooler (через pgBouncer)

```bash
# Использовать connection pooler вместо прямого подключения
supabase db push --db-url "postgresql://postgres:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### Вариант C: Direct connection (без pooler)

```bash
# Использовать прямое подключение вместо pooler
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.mjkssesvhowmncyctmvs.supabase.co:5432/postgres"
```

---

### 5. Проверка сетевых настроек

```bash
# Проверка VPN/Proxy (может блокировать Supabase)
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Отключить VPN если включён
# Отключить корпоративный proxy

# Проверка firewall
sudo pfctl -s rules | grep 5432  # macOS
# sudo iptables -L | grep 5432   # Linux
```

---

### 6. Альтернатива: Supabase Management API

Если CLI не работает, использовать REST API для миграции:

```bash
# Получить список миграций
curl -X GET 'https://api.supabase.com/v1/projects/mjkssesvhowmncyctmvs/database/migrations' \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"

# Применить миграцию через API
curl -X POST 'https://api.supabase.com/v1/projects/mjkssesvhowmncyctmvs/database/migrations' \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @supabase/migrations/20251111000002_add_schedule_rank_fields.sql
```

---

### 7. Debugging с подробными логами

```bash
# Запуск с debug логами
supabase db push --debug 2>&1 | tee supabase-debug.log

# Проверка логов
cat supabase-debug.log
```

---

## 🔧 Наиболее вероятные причины и решения

### Причина 1: Docker не запущен
**Симптом:** `Cannot connect to the Docker daemon`
**Решение:**
```bash
open -a Docker  # macOS
# Подождать запуска Docker (~30 сек)
supabase status
```

---

### Причина 2: VPN/Proxy блокирует подключение
**Симптом:** `connection reset by peer`, `tls error`
**Решение:**
- Отключить VPN
- Проверить корпоративный proxy
- Попробовать другую сеть (мобильный hotspot)

---

### Причина 3: Firewall блокирует порт 5432
**Симптом:** `connection refused`, `timeout`
**Решение:**
```bash
# macOS
sudo pfctl -d  # Временно отключить firewall для теста

# Или добавить правило
sudo pfctl -f /etc/pf.conf
```

---

### Причина 4: Неправильный password/credentials
**Симптом:** `authentication failed`
**Решение:**
1. Открыть Supabase Dashboard
2. Settings → Database → Reset database password
3. Обновить `.env` файл с новым паролем
4. Повторить `supabase db push`

---

### Причина 5: Connection pooler проблемы
**Симптом:** `connection reset by peer` через pooler
**Решение:** Использовать прямое подключение (см. Вариант C выше)

---

## 📋 Чеклист диагностики для новой сессии

```
В новой сессии Claude Code скажите:

"Проблема с supabase db push - connection reset by peer.
Нужно исправить подключение к Supabase перед продолжением feature 005.
Проведи диагностику по файлу TROUBLESHOOTING_SUPABASE.md
и исправь проблему."
```

### Шаги для Claude:

- [ ] Проверить Docker статус (`docker info`)
- [ ] Если Docker не запущен → запустить и дождаться
- [ ] Проверить `supabase status`
- [ ] Попробовать `supabase db push` с `--debug`
- [ ] Если не работает → попробовать прямое подключение (без pooler)
- [ ] Если не работает → попробовать через `psql` напрямую
- [ ] Если не работает → проверить VPN/Proxy/Firewall
- [ ] После успешного подключения → задеплоить миграцию
- [ ] Проверить колонки в таблице `athletes`
- [ ] **ТОЛЬКО ПОСЛЕ ЭТОГО** → продолжить Phase 4-8

---

## 🎯 Успешный результат

После исправления должно работать:

```bash
cd /Users/nikitaizboldin/SuperClaude/WU_Coach2_GitHub_SpecKit/WU_Coach2_GH_SK

supabase db push
# ✅ Success. Applied migration 20251111000002_add_schedule_rank_fields.sql

supabase db diff
# ✅ No schema differences detected
```

---

## 📄 Документация

- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Connection troubleshooting: https://supabase.com/docs/guides/database/connecting-to-postgres
- PostgreSQL connection strings: https://www.postgresql.org/docs/current/libpq-connect.html

---

**ВАЖНО:** Не продолжайте реализацию Phase 4-8 пока не исправите подключение!
Миграция ДОЛЖНА быть задеплоена, иначе новый код не будет работать.
