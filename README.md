# Al Sabeel (السبيل)

React Router 8 (SSR) + Tailwind v4 / shadcn-ui, with i18n (en / fr / ar) set up
the same way as `course-management-saas`.

Requires Node > 22.22.

```bash
pnpm install
pnpm dev               # http://localhost:3000
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
- `app/data/explanations.ts` — scholars and their explanation series. Only series with real recordings
  are listed (MP3s hosted on archive.org, see `archiveSeries`); books without one show no explanations.
- `app/data/mushaf/{hafs,warsh}.md` — the Qur'an's full text in each riwayah (King Fahd Complex
  Uthmanic data, verbatim; format in each file's header), read by `mushaf.server.ts` for the
  Tafsīr section (`/categories/tafsir`, under Qur'ān with Recitation), shown a Madinah-mushaf page at a time (`/mushaf/:mushafId/page/:page`). Both riwayat are drawn in the KFGQPC Uthmanic font in `public/fonts/kfgqpc/`.
- `app/data/quran-search/simple-clean.txt` — Tanzil's Ḥafṣ text in everyday spelling (CC BY 3.0,
  verbatim with its notice; credit and link to tanzil.net shown with word results), used only to
  match words typed in the Qur'an search (`quran-search.server.ts`, `/api/loaders/mushaf/:mushafId/search`).
  The search also takes 2:255, "البقرة 255", a page ("ص 50") or a surah, and opens the page at
  `#ayah-<surah>-<n>`, which the page lights up.
- `app/data/tafsir/{muyassar,saadi}.md` — tafsirs read in the app when an ayah is tapped, by ayah
  (or group of ayat explained together) in Ḥafṣ's count, read by `tafsir.server.ts`: al-Tafsīr
  al-Muyassar (King Fahd Complex) from Tanzil.net (terms: non-commercial use, source credited and
  linked), sent with each mushaf page; as-Saʿdī from the Quranic Universal Library, fetched from
  `/api/loaders/tafsir/:tafsirId/:surah?ayahs=…` when its tab is opened.
- `app/lib/progress.ts` — progress, streak and notes in `localStorage` — there is no login by design.
- `app/lib/schedule.ts` — weekday → science (week starts Saturday), current book, progress maths.

Design: ink-black with a green cast, emerald primary, gold for streaks; Readex Pro for Arabic UI text, Noto Naskh Arabic for Arabic titles, Amiri for the adhkar,
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
