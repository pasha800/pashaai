# PashaAI — Premium Offline Assistant

PashaAI وێبسایتێکی static و RTL ـە بۆ چاتکردن، فێرکردنی زانیاری، گەڕانی ناوخۆیی، Knowledge Pack، داشبۆرد و ڕێکخستنی ڕەفتاری وەڵامدانەوە. سیستەمەکە بە `localStorage` و `IndexedDB` کار دەکات و دەتوانێت دوای ئامادەکردنی زانیاری بە شێوەیەکی ئۆفلاین کار بکات.

## تایبەتمەندییە سەرەکییەکان

- چاتی ئۆفلاین لەسەر زانیاریی فێرکراو
- فێرکردنی زانیاری بەڕێوەبەر
- Smart fill بۆ تێکستی درێژ
- Knowledge base بە import/export
- Dashboard بۆ ژمارەی بابەت، هاوپۆل، چات و storage
- Settings بۆ bot name، confidence threshold، sources و answer style
- Knowledge Pack بە manifest و JSONL
- Premium visual layer لە `premium.css`
- Premium UX shortcuts و command bar لە `ux.js`

## فایلە سەرەکییەکان

```text
index.html
styles.css
premium.css
app.js
ux.js
manifest.json
knowledge-pack/
```

## Shortcut ـەکان

- `Ctrl + K` یان `Cmd + K`: گەڕانەوە بۆ چات و focus کردنی خانەی نووسین
- `Ctrl + N` یان `Cmd + N`: دەستپێکردنی چاتی نوێ
- `Ctrl + Enter` یان `Cmd + Enter`: ناردنی نامە لە کاتی focus لە خانەی چات

## گۆڕانکاریی Premium

- دیزاینی glass/dark luxury بۆ panel، topbar، sidebar، chat و dashboard
- Command bar بۆ کرداری خێرا
- Character counter بۆ chat input
- Copy دوایین وەڵام و copy هەموو چات
- Meta tags و title ـی باشتر بۆ PashaAI
- Mobile polish و focus ring بۆ accessibility

## تێبینی پاراستن

ئەم app ـە backend نییە. زانیارییەکان لە براوسەری بەکارهێنەر هەڵدەگیرێن. ئەگەر لەسەر ئامێری گشتی بەکاربهێنرێت، پێویستە مێژوو، زانیاری و local storage پاک بکرێتەوە.

## پێش Deploy

- `manifest.json` و `knowledge-pack/manifest.json` تاقی بکەوە.
- import/export ـی JSON تاقی بکەوە.
- Knowledge Pack لە HTTP/HTTPS تاقی بکەوە، چونکە `file://` هەندێک سنووری CORS هەیە.
- لە mobile، desktop و browser ـە جیاوازەکان چات، dashboard و settings تاقی بکەوە.
