# Инструкция по развёртыванию портала «Негодяи» на Beget

Приложение представляет собой современный Full-Stack портал (Node.js + Express + React + Tailwind CSS + WebSocket для онлайн-покера + PostgreSQL с ORM Drizzle и локальным отказоустойчивым хранилищем `data/app_storage.json`).

Вы можете развернуть приложение на хостинге **Beget** двумя способами:
1. **Способ 1: Beget VPS / Cloud (Рекомендуемый)** — максимальная скорость, полноценная поддержка WebSockets для покерного стола, возможность запуска через Docker Compose в 1 команду.
2. **Способ 2: Beget Виртуальный Хостинг (Shared Hosting с разделом «Node.js»)** — простой запуск через панель управления Beget.

---

## Способ 1. Развёртывание на Beget VPS / Cloud (Рекомендуемый)

На виртуальном сервере (VPS) от Beget запуск осуществляется в изолированном контейнере с собственной базой PostgreSQL и постоянными дисковыми томами.

### Шаг 1. Заказ сервера на Beget
1. В панели управления Beget перейдите в раздел **«VPS / Облако»**.
2. Создайте сервер с операционной системой **Ubuntu 22.04 или 24.04** (рекомендуемый тариф: от 2 ГБ RAM).
3. При создании вы можете выбрать предустановку **Docker** либо установить его вручную.

### Шаг 2. Клонирование и настройка
Подключитесь к серверу по SSH:
```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```

Клонируйте проект или скопируйте файлы приложения на сервер:
```bash
mkdir -p /var/www/negodyai
cd /var/www/negodyai
# (Загрузите файлы проекта через git clone или rsync / SFTP)
```

Создайте файл `.env`:
```bash
cp .env.example .env
nano .env
```
Задайте надёжные пароли для базы данных:
```env
POSTGRES_USER=negodyai_admin
POSTGRES_PASSWORD=ваш_надежный_пароль
POSTGRES_DB=negodyai_db
PORT=3000
NODE_ENV=production
APP_URL=https://ваш-домен.ru
```

### Шаг 3. Запуск через Docker Compose (В 1 команду)
В папке с проектом выполните:
```bash
docker compose up -d --build
```

Docker поднимет:
- Контейнер `postgres` (PostgreSQL 16 с постоянным томом данных `pg_data`)
- Контейнер `app` (Node.js сервер с автоматически скомпилированным React-приложением, REST API и WebSocket-сервером)

Проверить статус работы:
```bash
docker compose ps
docker compose logs -f app
```

### Шаг 4. Настройка домена и SSL через NGINX
Настройте NGINX для проксирования на порт 3000 с поддержкой WebSockets:
```nginx
server {
    server_name ваш-домен.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Установите бесплатный SSL-сертификат:
```bash
certbot --nginx -d ваш-домен.ru
```

---

## Способ 2. Развёртывание на Виртуальном хостинге Beget (Shared Hosting Node.js)

На виртуальном хостинге Beget запуск приложений происходит через менеджер Phusion Passenger.

### Шаг 1. Создание сайта и выбор версии Node.js
1. В панели управления Beget перейдите в раздел **«Сайты»** и создайте сайт для вашего домена (например, `negodyai.ru`).
2. В настройках сайта найдите пункт **«Node.js»** и переключите переключатель в положение **«Включено»**.
3. Выберите версию **Node.js 20** или **Node.js 22**.
4. Точкой входа (Application Entry File) укажите `app.js` (уже подготовлен в корне репозитория).

### Шаг 2. Создание базы данных PostgreSQL на Beget
1. В панели Beget откройте раздел **«Базы данных»** ➔ **«PostgreSQL»**.
2. Нажмите **«Создать базу данных»**.
3. Укажите имя базы, имя пользователя и сгенерируйте надёжный пароль.
4. Скопируйте параметры подключения: хост (обычно `localhost`), имя БД, логин и пароль.

### Шаг 3. Загрузка файлов на хостинг
1. Загрузите файлы репозитория в директорию вашего сайта на Beget (например, `/home/u/username/negodyai.ru/public_html/`).
2. Создайте файл `.env` в этой папке и пропишите параметры вашей PostgreSQL базы:
```env
PORT=3000
NODE_ENV=production
SQL_HOST=localhost
SQL_USER=ваш_логин_бд_beget
SQL_PASSWORD=ваш_пароль_бд_beget
SQL_DB_NAME=ваше_имя_бд_beget
APP_URL=https://negodyai.ru
```

### Шаг 4. Сборка и запуск
Подключитесь по SSH к хостингу Beget:
```bash
ssh username@username.beget.tech
cd ~/negodyai.ru/public_html
npm install --production=false
npm run build
```

После завершения сборки перезапустите приложение в панели управления Beget в разделе **«Node.js»** кнопкой **«Перезапустить»** (или выполните `touch tmp/restart.txt`).

Проверьте работоспособность в браузере:
`https://negodyai.ru/api/health`

---

## Проверка работоспособности и архитектура отказоустойчивости

1. **База данных PostgreSQL**:
   - Автоматически создает все 18 таблиц при первом запуске (`participants`, `excursions`, `tasks`, `menu_items`, `grocery_items`, `inventory_items`, `bot_config`, `contests`, `messages`, `admin_settings`, `gallery_photos`, `team_documents`, `fund_records`, `fund_expenses`, `creativity_ideas`, `team_stories`, `rally_coins`, `contest_history`).
   - Автоматически применяет миграции недостающих полей без потери существующих записей.

2. **Двойная защита данных (Dual Persistence)**:
   - Если сервер PostgreSQL временно перезагружается или недоступен, приложение автоматически переключается на внутреннее файловое хранилище `data/app_storage.json`. Никакие данные участников, взносов и идей не потеряются!

3. **Сетевой покерный стол и WebSocket**:
   - Эндпоинт `/ws/poker` работает поверх того же HTTP-сервера и порта, не требуя открытия дополнительных нестандартных портов наружу.
