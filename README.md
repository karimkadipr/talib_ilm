# Islamic Studies

React Router 8 (SSR) + Tailwind v4 / shadcn-ui, with i18n (en / fr / ar) set up
the same way as `course-management-saas`.

Requires Node > 22.22.

```bash
pnpm install
pnpm dev               # http://localhost:5173
pnpm typecheck
pnpm build && pnpm start
```

## What it is

A dark-mode app for following Abū ʿUmar al-ʿUtaybī's study programme
([source](https://saaid.org/Minute/mm12.htm)) and watching several scholars'
explanations (shurūḥ) of each book.

| Route | Screen |
| --- | --- |
| `/today` | Today: the day's science and next book, resume watching, daily programme checklist + streak, week strip |
| `/` | The programme (home): the whole week; Mon/Wed/Fri alternate two sciences week by week |
| `/subjects/:subjectId` | Levels 1–4 as a stepper; «أو» alternatives grouped as "choose one"; further reading |
| `/books/:bookId` | Title page; scholar cards (one per explanation) select the lesson list (`?s=scholarId`) |
| `/watch/:seriesId/:lesson` | Player, lesson list, switch to another scholar, per-lesson notes |

Data:

- `app/data/curriculum.ts` — the full programme (Arabic + transliteration). Book ids are the stable keys.
- `app/data/explanations.ts` — **sample** scholars/series. Lesson counts and durations are made up and
  no `videoId`s are set; the player shows a placeholder until one is.
- `app/lib/progress.ts` — progress, streak and notes in `localStorage` — there is no login by design.
- `app/lib/schedule.ts` — weekday → science (week starts Saturday), current book, progress maths.

Design: ink-black with a green cast, emerald primary, gold for streaks; Amiri for Arabic titles,
generated typographic book covers, an eight-point-star (khatam) pattern (`bg-khatam`), and a
per-science hue set with `style={{ "--hue": n }}` + the `tint-*` utilities in `app/app.css`.
Arabic strings inside other-language pages use `lang="ar"` (not `dir="rtl"`) so they render RTL
but stay aligned with the page.

## i18n

| File | Role |
| --- | --- |
| `app/lib/i18n.constants.ts` | Supported languages (default listed last), labels |
| `app/locales/<lng>/namespaces/<ns>.ts` | Translations; `en` is the type source of truth |
| `app/middleware/i18next.ts` | `remix-i18next` middleware: detects the locale (cookie, then `Accept-Language`) and creates the per-request i18next instance |
| `app/root.tsx` | Registers the middleware, sets `<html lang dir>` |
| `app/entry.server.tsx` | Renders with the middleware's instance |
| `app/entry.client.tsx` | Hydrates with the `<html lang>` language, fetches namespaces from `/api/loaders/locales/:lng/:ns` |
| `app/routes/api.actions.set-locale` | Saves the choice in the `lng` cookie (used by `LanguageSwitcher`) |
| `app/routes/$` | Catch-all 404, so unmatched URLs still get translations |

Keys are flat (`"home.title"`). Use `t("key")` in components and
`getInstance(context).t("key")` in loaders/actions.

```bash
pnpm i18n:extract      # sync keys from code into every locale file
pnpm i18n:status       # translation coverage per locale
```

Arabic sets `dir="rtl"`; `components.json` has `"rtl": true`, so shadcn
components are generated with logical classes (`ms-`, `ps-`, `start-`). Use
those instead of `ml-` / `pl-` / `left-` in your own code too.

## Layout

```
app/
  root.tsx
  routes.ts              flatRoutes() — folder per route
  routes/<name>/route.tsx
  components/ui/         shadcn (pnpm dlx shadcn@latest add <c>)
  locales/
  middleware/
  services/cookies/
```
