# Dibs

Репозиторий `gulf-creators` — платформа монетизации авторов для Залива: платные подписки, платные сообщения, чаевые. Арабский-first, RTL.
Техспека — [SPEC.md](SPEC.md), правила разработки — [CLAUDE.md](CLAUDE.md).

Текущее состояние: спринт 0, каркас без бизнес-логики.

## Что где лежит

```
apps/
  web/        Next.js 15 (App Router), TypeScript, Tailwind 4, next-intl (ar, en; RTL для ar)
    messages/   переводы: ar.json, en.json
    src/app/    страницы; всё под [locale]
    src/i18n/   настройки локалей и навигации next-intl
  api/        NestJS, TypeScript; пока только GET /health
packages/
  db/         Prisma: prisma/schema.prisma (14 таблиц), prisma/migrations, клиент для API
  shared/     общие типы и константы (локали, валюты, Money)
SPEC.md       техспека v1
CLAUDE.md     правила проекта
.env.example  все переменные окружения
docker-compose.yml  PostgreSQL 16 и Redis для локальной разработки
.github/workflows/ci.yml  проверки на каждый PR и пуш в main
```

## Требования

- Node.js 22+
- pnpm 10 (`corepack enable` подтянет версию из `package.json`)
- Docker — для локальных PostgreSQL 16 и Redis (`docker compose up -d`)

## Запуск локально

```bash
pnpm install
cp .env.example .env.local   # заполнить значения; файл в git не попадает
docker compose up -d         # PostgreSQL и Redis
pnpm db:migrate              # применить миграции к локальной базе
pnpm dev                     # собирает packages/*, затем запускает web и api
```

- Сайт: http://localhost:3000 — арабская версия (RTL) на `/`, английская на `/en`; переключатель в шапке.
  При первом заходе на `/` next-intl смотрит на язык браузера: при английском браузере откроется `/en`.
  Выбор в переключателе запоминается в cookie.
- API: http://localhost:4000/health

Все приложения читают один файл `.env.local` в корне репозитория.

## Команды

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | web на :3000 и api на :4000 в режиме разработки |
| `pnpm build` | сборка всех пакетов |
| `pnpm typecheck` | проверка типов во всех пакетах |
| `pnpm db:generate` | генерация Prisma Client |
| `pnpm db:validate` | проверка Prisma-схемы |
| `pnpm db:migrate` | `prisma migrate dev` (нужны PostgreSQL и `DATABASE_URL`) |

Миграции создаются и применяются только через Prisma Migrate.

## CI

На каждый PR и пуш в `main` GitHub Actions проверяет: Prisma-схема валидна, миграции применяются к пустой базе
и совпадают со схемой (изменил схему — создай миграцию через `pnpm db:migrate`), типы, сборка.
