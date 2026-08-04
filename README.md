# nuriplastic

## Installed Claude Code plugins

### last30days

[mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) — an agent-led
search engine that researches a topic across Reddit, X, YouTube, TikTok, Hacker News,
Polymarket, GitHub, and more, ranked by real engagement instead of SEO.

Installed as a marketplace plugin, declared in `.claude/settings.json`, so any Claude Code
session opened on this repo picks it up automatically and gets updates from the marketplace.

Usage:

```
/last30days <topic>
```

Reddit, Hacker News, Polymarket, and GitHub work with no API keys. The skill's first-run
setup wizard unlocks X, YouTube, TikTok, arXiv, and Techmeme.

**Note on Python:** the engine requires Python 3.12+. This repo pins
`LAST30DAYS_PYTHON=python3.13` in `.claude/settings.json` because the default `python3`
here is 3.11. Remove or adjust that value on machines where `python3` is already 3.12+.

Health check:

```
python3.13 <plugin-dir>/skills/last30days/scripts/last30days.py --preflight
```
