# Contributing

Contributions are welcome.

## Development Notes

- Keep the extension read-only against the Nasdaq Trader source page.
- Do not add scraping of logged-in, paid, or access-controlled pages.
- Do not include personal watchlists, private emails, API keys, local paths, or browser profile data.
- Prefer small parser updates in `src/trade-halt-parser.js` when Nasdaq changes table markup.
- Update `README.md` and `SETTINGS.md` when a setting or source behavior changes.

## Run Tests

```bash
node tests/trade_halt_parser.test.js
node --check src/background.js
node --check src/popup.js
node --check src/trade-halt-parser.js
```

Then load the extension unpacked in Edge or Chrome and run **Check now** from the popup.
