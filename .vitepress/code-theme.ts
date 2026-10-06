// Dark code theme using the decisionplane.dev syntax colours.
export const dpDark = {
  name: 'decisionplane-dark',
  type: 'dark' as const,
  colors: {
    'editor.background': '#101C21',
    'editor.foreground': '#E3EEF0',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5E777E', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.new'], settings: { foreground: '#9CC9D4' } },
    { scope: ['string', 'string.quoted', 'markup.inline.raw'], settings: { foreground: '#C9DB9A' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.type', 'support.class', 'entity.name.class'], settings: { foreground: '#F2B33D' } },
    { scope: ['constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: '#3FCF9E' } },
    { scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.type.property-name', 'entity.name.tag'], settings: { foreground: '#E3EEF0' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: '#8FA7AD' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#9CC9D4' } },
  ],
}
