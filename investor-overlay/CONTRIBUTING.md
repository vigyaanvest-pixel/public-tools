# Contributing

Contributions are welcome.

## Development setup

1. Install Node.js 20+.
2. `cd public-tools/investor-overlay`
3. `npm install`
4. `npm run dev` or `npm run build`
5. Load `dist/` unpacked in Chrome or Edge.

## Adding a site extractor

1. Add detector in `src/content/detectors/`.
2. Add extractor in `src/content/extractors/` with try/catch → `null` on failure.
3. Update `docs/FIELD_AVAILABILITY_MATRIX.md` with manual test results.
4. Add URL patterns to `src/manifest.json` host_permissions if needed.
5. Run `npm run test` and manual browser checks per `docs/MANUAL_TEST_CHECKLIST.md`.

## Rules

- Never scrape behind login walls or bypass paywalls.
- Missing fields must render as **—**.
- Do not send user notes to external servers.
- No proprietary backend calls in MVP.

## Run tests

```bash
npm run test
```
