# Manual Test Checklist

Use Chrome and Edge developer mode. Load `dist/` unpacked.

## Install

- [ ] Extension loads without errors
- [ ] Toolbar icon visible
- [ ] Popup opens

## Flow A — page detected

- [ ] Yahoo Finance quote page detects symbol
- [ ] Floating [S] button appears on supported page
- [ ] Sidebar opens with detected symbol
- [ ] Extracted fields show "from page" hint or —

## Flow B — manual symbol

- [ ] On blank/unsupported page, popup accepts symbol + market
- [ ] Load opens sidebar with notes/watchlist working

## Flow C — watchlist

- [ ] Add symbol to watchlist
- [ ] Click watchlist row switches sidebar symbol

## Tabs

- [ ] All 8 tabs render: Snapshot, Valuation, Quality, Chart, Events, Thesis, Watchlist, Dashboard
- [ ] Sidebar collapses and closes

## Storage

- [ ] Notes persist after browser restart
- [ ] Watchlist persists after browser restart

## Export / import

- [ ] Export produces valid JSON
- [ ] Import merge works
- [ ] Import replace shows confirmation
- [ ] Invalid JSON shows error

## Settings

- [ ] Floating button toggle works
- [ ] Clear data tiers work with confirmation
- [ ] Privacy/disclaimer text visible

## Canonical test symbols

**US:** AAPL, MSFT, JPM, NVDA, SPY  
**India:** RELIANCE, HDFCBANK, INFY, TATAMOTORS
