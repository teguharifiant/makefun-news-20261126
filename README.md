# The World Today — 26 November 2026

[![make.fun](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/teguharifiant/makefun-news-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/teguharifiant/makefun-news-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

An entry for the [make.fun bounty "Sum up 26 November's world news in one image"](https://make.fun/bounty/news-image-20261126) (news-image-20261126, $100, top 50).

## What it is

`main.ts` is a small, dependency-free Node 22 program that draws a newspaper
front page — "THE WORLD TODAY — THURSDAY, 26 NOVEMBER 2026" — and writes it
as a 1024×1024 PNG to `/output/entry.png`. It draws everything itself with a
hand-built 5×7 bitmap font and a from-scratch PNG encoder (Node's built-in
`zlib` only). No network, no assets, no timestamps: running it twice produces
byte-identical output.

## The stories on the page

All first reported on Thursday 26 November 2026, or updated that day:

- **Lead — Cairo tanker fire:** a fuel tanker overturned and exploded on the
  Giza Ring Road late on Wednesday; the death toll rose to at least 30 on
  26 November, with 15 injured (Reuters, Al Arabiya).
- **North Korea:** Kim Jong Un called for tactical nuclear weapons to be
  deployed "across multiple domains", KCNA reported on Thursday.
- **Oil:** Brent crude settled 3.5% higher at $94.61 after Yemen's Houthis
  said they hit Saudi Arabia's Ras Tanura refinery; Riyadh said it shot down
  four drones (Reuters).
- **Trade:** Washington proposed new Section 301 tariffs of up to 40% on 14
  trading partners, including China, the EU and Japan (Reuters).
- **War in Ukraine:** Kyiv said its forces struck the Savasleyka air base
  east of Moscow, knocking out three MiG-31 jets and two Su-34 bombers
  (Reuters).
- **Space:** Pakistan's Muhammad Zeeshan Ali joined China's Tiangong crew
  aboard Shenzhou-24, the first foreign astronaut to visit the station.
- **Also:** Mumbai marks 18 years since the 26/11 attacks; Thanksgiving Day
  in the United States; North Korea expels the Swiss envoy and orders its
  Pyongyang office shut within 48 hours.

## Run it

```sh
node main.ts
# writes /output/entry.png (1024x1024, well under the 1 MiB limit)
```

## Licence

MIT — see [LICENSE](LICENSE).
