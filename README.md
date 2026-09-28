# gulf-creators

Платформа монетизации авторов для Залива: платные подписки, платные сообщения, чаевые. Арабский-first, RTL.
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
  db/         Prisma: prisma/schema.prisma (12 таблиц), клиент для API
  shared/     общие типы и константы (локали, валюты, Money)
SPEC.md       техспека v1
CLAUDE.md     правила проекта
.env.example  все переменные окружения
```

## Требования

- Node.js 22+
- pnpm 10 (`corepack enable` подтянет версию из `package.json`)
- PostgreSQL 16 — нужен только для миграций; сайт и API в спринте 0 работают без базы

## Запуск локально

```bash
pnpm install
cp .env.example .env.local   # заполнить значения; файл в git не попадает
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
