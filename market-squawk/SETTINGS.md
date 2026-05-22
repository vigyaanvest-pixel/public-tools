# Market Squawk Settings Guide

This guide explains what each popup control does and when to adjust it.

## Master Switch

**On / Off toggle**

Turns live headline reading on or off.

Use it when you want to keep the extension loaded but temporarily stop automatic speech. The **Read Top** button can still force a manual read.

## Voice

Chooses the browser or system text-to-speech voice.

Use the default voice first. Change it if the default voice is too robotic, too quiet, hard to understand, or uses the wrong accent for your preference.

## Rate

Controls how fast headlines are spoken.

Use a slower rate when headlines contain ticker symbols, numbers, earnings terms, or company names you want to catch accurately. Use a faster rate if you mainly want quick awareness while watching charts.

Suggested range:

- `0.8x` to `1.0x` for careful listening
- `1.1x` to `1.3x` for active market monitoring
- Above `1.3x` only if your chosen voice remains clear

## Volume

Controls speech volume from the extension.

Lower it if you use the tool as background awareness. Raise it if browser audio competes with chart alerts, meetings, or music.

## Watch Top Items

Controls how many top headlines Market Squawk monitors and reads when a page changes.

Use a smaller number, such as `1` to `3`, if you only care about the newest headline and want fewer interruptions. Use `5`, the default, for a balanced news sweep. Use a higher number only when the source page updates in batches and you do not want to miss secondary headlines.

## Auto Refresh Minutes

Reloads supported source pages after the selected number of minutes.

Use this when a source page does not reliably update itself. The default is `60` minutes. Set it to `0` to disable automatic refresh.

Good starting points:

- `0` if the source already live-updates well
- `15` to `30` for active monitoring
- `60` for light background monitoring

## Smart Squawk Wording

Rewrites common market shorthand into speech-friendly wording.

Keep this on if you want clearer spoken headlines. For example, it expands terms such as `Q1`, `EPS`, `Rev`, `M&A`, and some ticker-style phrasing. Turn it off if you want the headline read closer to the exact page text.

## Read Watched Top Items On Load

Reads the configured **Watch Top Items** count when a supported source page loads.

Keep this on if you want an immediate briefing when opening or refreshing a source page. Turn it off if you only want Market Squawk to read headlines that arrive after the page is already open.

## Honor Read Memory

Controls whether Market Squawk skips headlines it has already read recently.

Keep this on for normal use so refreshes do not repeat the same headlines again and again. Turn it off when you want every page reload to read the current top headlines, even if they were already read. This is useful when you are testing sources, tuning voice settings, or returning to your desk and want the latest top items repeated.

Read memory is stored locally in the browser per source and expires after about a week.

## Sources

Enables or disables individual supported sources.

Disable a source if you do not use it, if it becomes noisy, or if you want fewer tabs to speak. Click **Open** next to a source to launch the supported page directly.

## Read Top

Manually reads the current top headlines from the active supported source. It follows the **Watch Top Items** count.

Use this when you want a fresh audible snapshot without waiting for a page update or refresh.

## Test Voice

Plays a short sample using the selected voice, rate, and volume.

Use it after changing voice, rate, or volume so you can confirm the setup before opening a live market source.

## Stop

Stops current speech immediately.

Use it when a headline batch is no longer useful, when you need silence quickly, or before changing voice settings.

## Recommended Starting Setup

- **Watch Top Items:** `5`
- **Auto Refresh Minutes:** `60`
- **Smart Squawk Wording:** on
- **Read Watched Top Items On Load:** on
- **Honor Read Memory:** on
- **Rate:** `1.0x` to `1.1x`
- **Volume:** adjust to your environment
