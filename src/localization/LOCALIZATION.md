# Localization

Untranslated pages are drafted in each secondary locale (Spanish `/es`, French `/fr`), so `/<locale>/<slug>` returns a 404. Two pieces handle visitors who would otherwise land there.

## 1. 404 page redirect (required)

Catches every route to an untranslated page: search results, bookmarks, external links. Add to the 404 page's custom code (inside `<head>`):

```html
<script>
  (function () {
    var path = location.pathname;
    var tail = location.search + location.hash;

    // A full typeform.com URL inside the path, e.g. /es/https://www.typeform.com/es/pricing
    // or /https://www.typeform.com/es/pricing: go to the path inside it.
    var nested = path.match(/^(?:\/(?:es|fr))?\/https?:\/+(?:www\.)?typeform\.com(\/.*)?$/i);
    if (nested) {
      location.replace((nested[1] || '/').replace(/^\/+/, '/') + tail);
      return;
    }

    var m = path.match(/^\/(es|fr)(\/.*)$/);
    if (!m) return;

    // Collapse leading slashes so /es//example.com can't send visitors off-site
    var english = m[2].replace(/^\/+/, '/');
    // Spanish templates use a translated slug: /es/plantillas... -> /templates...
    if (m[1] === 'es') english = english.replace(/^\/plantillas(?=(-category|-sub-category)?(\/|$))/, '/templates');

    location.replace(english + tail);
  })();
</script>
```

Only paths that don't exist reach the 404 page, so translated pages are never affected. If the English page doesn't exist either, the English 404 loads and stops there. A nested URL that points at an untranslated page takes two hops (nested URL, then locale), both handled here. When adding a locale, add it to both `(es|fr)` groups, and add any translated collection slugs to the slug line here and to `LOCALIZED_SLUGS` in the script.

## 2. Link rewriting (optional)

`rewrite-untranslated-links.js` rewrites internal `/<locale>/...` links that aren't translated to their English path, so clicks skip the 404 hop.

Translated pages are listed once in `TRANSLATED_PAGES` as English paths (e.g. `/pricing`), and apply to every locale in `LOCALES`. When a page is translated, add its English path there and tag a new release. A page missing from the list only means its links go to the English version.

Collections with a translated slug (Spanish templates live under `/es/plantillas`) are listed per locale in `LOCALIZED_SLUGS`: links to their items are left alone, and anything else under the slug is pointed at the English slug. Links with a full typeform.com URL inside the path (`/es/https://www.typeform.com/es/pricing`) are unwrapped to the path inside it.

To add a locale, add it to `LOCALES` and to both of the 404 snippet's `(es|fr)` groups.

Add the script site-wide, before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/makebuild-code/typeform@<version>/src/localization/rewrite-untranslated-links.min.js" defer></script>
```
