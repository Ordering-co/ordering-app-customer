# i18n — App Marketplace (implementation notes / implementation notes)

Source of truth for UI translation keys (`useLanguage` / `t('KEY', 'fallback')`).

## Config (locales SSoT)

[`config.json`](./config.json):

```json
{
  "product": "ordering_app",
  "prefix": "ORDERING_APP_",
  "sourceLanguage": "en",
  "supportedLocales": ["es", "fr", "it", "de", "pt", "da", "nl", "ar", "el", "bg", "tr"],
  "catalogPath": "i18n/translations.json",
  "legacyCatalogPath": "app-marketplace-translations.json"
}
```

- Catalog keys are **unprefixed**. Sync applies `ORDERING_APP_` at POST time.
- Runtime already prefixes via `app_internal_name: ordering_app`.

## Commands

```bash
pnpm i18n:generate                         # scan src/ → translations.json + legacy JSON/CSV
pnpm i18n:verify                           # fail if keys/locales incomplete
pnpm i18n:missing --summary
pnpm i18n:missing --limit 40 --write i18n/batch-missing.json
pnpm i18n:apply-batch i18n/batch-filled.json --strict
pnpm i18n:sync                             # dry-run (default)
pnpm i18n:sync:live                        # Phase 7 only
```

Fill locales with project skill [`.cursor/skills/translate-keys/SKILL.md`](../.cursor/skills/translate-keys/SKILL.md) (`/translate-keys`).

## Legacy files

`generate` still updates root:

- `app-marketplace-translations.json` — `{ translation: { KEY: en } }`
- `app-marketplace-translations.csv` — `Key,Value`

Prefer `i18n/translations.json` for multi-locale work going forward.

## CI

- **i18n Verify** in `.github/workflows/ci.yml` (required by quality gate)
- **i18n Sync** dry-run: `.github/workflows/i18n-sync.yml` on `push` paths `i18n/**`

Live sync waits for Phase 7 (api-core PR merged + secrets).

## Scope

Scans `src/` including `src/@/components` submodule. Do not edit the submodule from this repo for string fixes.

For local live runs, copy [`i18n/.env.example`](./.env.example) to `i18n/.env` (gitignored). `sync.cjs` loads it automatically.
