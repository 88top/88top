const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createGettext } = require('vue3-gettext');

test('mount success message escapes API-supplied disk and mount names', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/action-disk-mount/index.vue'), 'utf8');
  // Evaluate the actual template binding, including its escaping flag, against
  // the application's real translation library. No disk action is performed.
  const expression = source.match(/v-html="(\$gettext\('已成功将分区[^"\n]+)"/)[1];
  const gettext = createGettext({ defaultLanguage:'zh-cn', mutedLanguages:['zh-cn'], translations:{} });
  const html = new Function('$gettext', 'resultMount', `return ${expression}`)(gettext.$gettext,
    { path:'<img src=x onerror=alert(1)>', mountPoint:'<svg onload=alert(1)>' });
  assert(!html.includes('<img'));
  assert(!html.includes('<svg'));
  assert(html.includes('<a>&lt;svg'));
});
