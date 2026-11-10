# Localization

Untranslated pages are drafted in each secondary locale (Spanish `/es`, French `/fr`), so `/<locale>/<slug>` returns a 404. Two pieces handle visitors who would otherwise land there.

## 1. 404 page redirect (required)

Catches every route to an untranslated page: search results, bookmarks, external links. Add to the 404 page's custom code (inside `<head>`):

```html
<script>
  (function () {
    var m = location.pathname.match(/^\/(es|fr)(\/.*)$/);
    if (!m) return;

    // Collapse leading slashes so /es//example.com can't send visitors off-site
    var english = m[2].replace(/^\/+/, '/');
    // Leave URLs with a full URL inside the path (/es/https://...) on the 404: see below
    if (/^\/https?:/i.test(english)) return;
    // Spanish templates use a translated slug: /es/plantillas... -> /templates...
    if (m[1] === 'es') english = english.replace(/^\/plantillas(?=(-category|-sub-category)?(\/|$))/, '/templates');

    location.replace(english + location.search + location.hash);
  })();
</script>
```

Only paths that don't exist reach the 404 page, so translated pages are never affected. If the English page doesn't exist either, the English 404 loads and stops there. When adding a locale, add it to the `(es|fr)` group, and add any translated collection slugs to the slug line here and to `LOCALIZED_SLUGS` in the script.

Paths with a full URL inside them (`/https://www.typeform.com/<page>`, `/es/https://www.typeform.com/es/<page>`) are deliberately left on the 404. Since March 2026 they've come almost entirely from what looks like a crawler working through old-format Typeform URLs: about 285k sessions, each a new visitor, with one signup. Redirecting them would move that traffic onto real landing pages and blur their metrics; on the 404 they stay in obviously broken rows that reporting can filter out (landing page contains `/https://`). Stripping the locale from them is also what produced `/https://www.typeform.com/es/<page>` in the first place.

## 2. Link rewriting (optional)

`rewrite-untranslated-links.js` rewrites internal `/<locale>/...` links that aren't translated to their English path, so clicks skip the 404 hop.

Translated pages are listed once in `TRANSLATED_PAGES` as English paths (e.g. `/pricing`), and apply to every locale in `LOCALES`. When a page is translated, add its English path there and tag a new release. A page missing from the list only means its links go to the English version.

Collections with a translated slug (Spanish templates live under `/es/plantillas`) are listed per locale in `LOCALIZED_SLUGS`: links to their items are left alone, and anything else under the slug is pointed at the English slug. Links with a full typeform.com URL inside the path (`/es/https://www.typeform.com/es/pricing`) are unwrapped to the path inside it.

To add a locale, add it to `LOCALES` and to the 404 snippet's `(es|fr)` group.

Add the script site-wide, before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/makebuild-code/typeform@<version>/src/localization/rewrite-untranslated-links.min.js" defer></script>
```
