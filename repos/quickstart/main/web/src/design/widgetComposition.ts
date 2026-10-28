import { parse } from '@vue/compiler-sfc'
// Isolated design-build presentation only. Original business SFCs and scripts
// stay untouched; a changed anchor fails the build instead of silently drifting.
function replaceOnce(source: string, before: string, after: string): string {
  if (source.split(before).length !== 2) throw new Error('Widget composition anchor changed: ' + before)
  return source.replace(before, after)
}

export function composeWidgetTemplate(source: string, id: string): string {
  // Only header copy changes. Keep native callbacks, forms and source SFCs.
  if (id.endsWith('/src/pages/index/Storage/index.vue')) source = replaceOnce(source, "$gettext('配置存储服务')", "$gettext('存储配置')")
  if (id.endsWith('/src/pages/index/info/Docker.vue')) source = replaceOnce(source, "$gettext('Docker迁移')", "$gettext('数据迁移')")
  if (id.endsWith('/src/pages/index/info/SystemInfo.vue')) {
    source = replaceOnce(source, '<div class="content">', '<div class="content system-composition">')
    source = replaceOnce(source,
      '{{ version?.firmwareVersion }}（{{ $gettext("内核")}}：{{ version?.kernelVersion }}）',
      '{{ version?.firmwareVersion }}<small class="system-kernel">{{ $gettext("内核") }}：{{ version?.kernelVersion }}</small>')
  }
  if (['/src/pages/index/Storage/index.vue', '/src/pages/index/service/DownloadService.vue', '/src/pages/index/service/RemoteDomain.vue'].some(file => id.endsWith(file))) {
    // Edit only parsed selector elements: original expressions/handlers survive.
    const template = parse(source).descriptor.template
    if (!template?.ast) throw new Error('Missing service selector template: ' + id)
    const edits: { start: number; end: number; value: string }[] = []
    const visit = (node: any) => {
      const className = node.props?.find((p: any) => p.type === 6 && p.name === 'class')?.value?.content
      if (node.tag === 'div' && className?.split(' ').includes('item')) {
        const selected = node.props.find((p: any) => p.type === 7 && p.name === 'bind' && p.arg?.content === 'class')?.exp?.content?.match(/^\{ active: (.+) \}$/)?.[1]
        if (!selected || !node.props.some((p: any) => p.name === 'on' && p.arg?.content === 'click')) throw new Error('Service selection contract changed: ' + id)
        edits.push({start: node.loc.start.offset, end: node.loc.start.offset + 4, value: `<button type="button" :aria-pressed="${selected}"`})
        edits.push({start: node.loc.end.offset - 6, end: node.loc.end.offset, value: '</button>'})
      }
      for (const child of node.children || []) visit(child)
    }
    visit(template.ast)
    if (edits.length !== 6) throw new Error('Expected three service choices: ' + id)
    for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end)
  }
  if (id.endsWith('/src/pages/index/Storage/samba.vue')) {
    source = replaceOnce(source, '<div class="samba-item_name">', '<div class="samba-item_name" :data-label="$gettext(\'地址\')">')
    source = replaceOnce(source, '<div class="samba-item_value" :title="item.path">', '<div class="samba-item_value" :title="item.path" :data-label="$gettext(\'目录\')">')
  }
  return source
}
