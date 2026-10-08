# Localization

Untranslated pages are drafted in each secondary locale (Spanish `/es`, French `/fr`), so `/<locale>/<slug>` returns a 404. Two pieces handle visitors who would otherwise land there.

## 1. 404 page redirect (required)

Catches every route to an untranslated page: search results, bookmarks, external links. Add to the 404 page's custom code (inside `<head>`):

```html
<script>
  (function () {
    var m = location.pathname.match(/^\/(es|fr)(\/.*)$/);
    if (m) {
      location.replace(m[2] + location.search + location.hash);
    }
  })();
</script>
```

Only paths that don't exist reach the 404 page, so translated pages are never affected. If the English page doesn't exist either, the English 404 loads and stops there. When adding a locale, add it to the `(es|fr)` group.

## 2. Link rewriting (optional)

`rewrite-untranslated-links.js` rewrites internal `/<locale>/...` links that aren't translated to their English path, so clicks skip the 404 hop.

Translated pages are listed once in `TRANSLATED_PAGES` as English paths (e.g. `/pricing`), and apply to every locale in `LOCALES`. When a page is translated, add its English path there and tag a new release. A page missing from the list only means its links go to the English version. To add a locale, add it to `LOCALES` and to the 404 snippet's `(es|fr)` group.

Add the script site-wide, before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/makebuild-code/typeform@<version>/src/localization/rewrite-untranslated-links.min.js" defer></script>
```
