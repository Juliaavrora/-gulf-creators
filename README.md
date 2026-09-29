# Dibs

Репозиторий `gulf-creators` — платформа монетизации авторов для Залива: платные подписки, платные сообщения, чаевые. Арабский-first, RTL.
Техспека — [SPEC.md](SPEC.md), правила разработки — [CLAUDE.md](CLAUDE.md).

Текущее состояние: спринт 1 — страница автора, создание поста с фото, модерация первых постов (API + сайт); вход ещё не подключён.

## Что где лежит

```
apps/
  web/        Next.js 15 (App Router), TypeScript, Tailwind 4, next-intl (ar, en; RTL для ar)
    messages/   переводы: ar.json, en.json
    src/app/    страницы; всё под [locale]
    src/i18n/   настройки локалей и навигации next-intl
  api/        NestJS: страница автора, создание постов, медиа, модерация; правила доступа — src/access
    dev-media/  картинки для локальной разработки (CC0)
packages/
  db/         Prisma: prisma/schema.prisma (14 таблиц), prisma/migrations, src/seed.ts, клиент для API
  shared/     общие типы и константы (локали, валюты, Money, ответы API)
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
pnpm db:seed                 # тестовые данные: авторы sara.brews и noura.bakes (2 поста на проверке), фан, админ
pnpm dev                     # собирает packages/*, затем запускает web и api
```

- Сайт: http://localhost:3000 — арабская версия (RTL) на `/`, английская на `/en`; переключатель в шапке.
  При первом заходе на `/` next-intl смотрит на язык браузера: при английском браузере откроется `/en`.
  Выбор в переключателе запоминается в cookie.
- API: http://localhost:4000/health
- Страница автора: http://localhost:3000/sara.brews (и `/en/sara.brews`).
- Новый пост: http://localhost:3000/studio/new (нужно «войти» как автор, см. ниже).
- Модерация: http://localhost:3000/admin/moderation (нужно «войти» как админ).

Пока вход через Clerk не подключён, на главной сайта есть переключатель «войти как» (аноним / Сара — автор / Марьям — фан / админ;
только при `NEXT_PUBLIC_DEV_AUTH=true`). В запросах к API напрямую зрителя можно подставить заголовком
`x-dev-user: <clerk_user_id>` (работает только при `DEV_AUTH=true`, в проде запрещено):

```bash
curl -H 'x-dev-user: dev_maryam' http://localhost:4000/creators/sara.brews/posts   # подписчица «المقرّبون» + 1 покупка
curl -H 'x-dev-user: dev_sara'   http://localhost:4000/creators/sara.brews/posts   # сама автор — видит всё
```

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
| `pnpm db:seed` | тестовые данные (повторный запуск ничего не дублирует) |
| `pnpm db:reset` | пересоздать базу с нуля и залить тестовые данные |
| `pnpm test` | тесты API: правила доступа, подписанные ссылки, проверка поста, ввод цены, решения модерации |

Миграции создаются и применяются только через Prisma Migrate.

## CI

На каждый PR и пуш в `main` GitHub Actions проверяет: Prisma-схема валидна, миграции применяются к пустой базе
и совпадают со схемой (изменил схему — создай миграцию через `pnpm db:migrate`), типы, тесты, сборка.
