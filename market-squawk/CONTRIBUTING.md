# Contributing

Contributions are welcome.

## Add A Source

1. Add the source profile to `src/sources.js`.
2. Add the source match patterns to `manifest.json`.
3. Add or update tests in `tests/source_detection.test.js`.
4. Load the extension unpacked in Edge or Chrome and test the source page manually.

## Source Profile Tips

- Use narrow host and path patterns where possible.
- Prefer stable headline containers and title selectors.
- Keep the extension read-only. Do not add scraping, login bypassing, or paid-content extraction.
- Do not include personal names, private emails, API keys, local paths, or browser profile data.

## Run Tests

```bash
node tests/source_detection.test.js
```
