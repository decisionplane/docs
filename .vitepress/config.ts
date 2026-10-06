import { defineConfig } from 'vitepress'
import { dpDark } from './code-theme'

// DOCS_BASE: '/' for custom domain (docs.decisionplane.*) or apex GitHub Pages site;
// '/decisionplane/' (or similar) for <user>.github.io/<repo>/ deploys.
const base = process.env.DOCS_BASE || '/'

export default defineConfig({
  title: 'DecisionPlane',
  description: 'The agentic trust layer — audited decisioning for software, AI, and automation.',
  cleanUrls: true,
  appearance: 'dark',
  markdown: { theme: { light: 'github-light', dark: dpDark } },
  srcExclude: ['README.md'],
  base,

  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500&display=swap' }],
    ['meta', { name: 'theme-color', content: '#0C1519' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'DecisionPlane — the agentic trust layer' }],
    ['meta', { name: 'og:description', content: 'Audited decisioning for fintech ops, incident remediation, and AI automation. Every decision answers: what, why, by whose authority, and what if wrong.' }],
  ],

  themeConfig: {
    logo: { light: '/logo-light.svg', dark: '/logo.svg', alt: '' },
    siteTitle: 'DecisionPlane',

    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Integration', link: '/guide/integration' },
      { text: 'Reference', link: '/reference/sdk' },
      { text: 'Policy DSL', link: '/guide/policy-dsl' },
      {
        text: 'Governance',
        items: [
          { text: 'Overview', link: '/governance/' },
          { text: 'License (BSL-1.1)', link: '/governance/license' },
          { text: 'Audit-Log Retention', link: '/governance/retention' },
          { text: 'Compliance Posture', link: '/governance/compliance' },
          { text: 'SOC 2 Scope', link: '/governance/soc2' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is DecisionPlane?', link: '/guide/product' },
            { text: 'Quickstart (5 min)', link: '/guide/quickstart' },
            { text: 'Install the SDK', link: '/guide/install' },
            { text: 'Your First Decision', link: '/guide/first-decision' },
            { text: 'Inspect the Audit Chain', link: '/guide/audit-chain' },
          ],
        },
        {
          text: 'Architecture & Integration',
          items: [
            { text: 'Architecture Overview', link: '/guide/architecture' },
            { text: 'Integration Guide', link: '/guide/integration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'The Four Pillars', link: '/guide/four-pillars' },
            { text: 'Policy DSL', link: '/guide/policy-dsl' },
            { text: 'Library vs Daemon Mode', link: '/guide/deployment-modes' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'TypeScript / Node SDK', link: '/guide/integration#typescript--node-sdk' },
            { text: 'Python SDK', link: '/guide/python-sdk' },
            { text: 'Python SDK Recipes', link: '/guide/python-sdk-recipes' },
            { text: 'REST API', link: '/guide/integration#rest-api-direct' },
            { text: 'MCP (AI Agents)', link: '/guide/integration#mcp-ai-agents' },
            { text: 'Envoy Ext-AuthZ', link: '/guide/integration#envoy-ext-authz' },
          ],
        },
        {
          text: 'MCP Integration',
          items: [
            { text: 'Local Mode (30-second demo)', link: '/guide/local-mode' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'SDK API', link: '/reference/sdk' },
            { text: 'Policy Schema', link: '/reference/policy-schema' },
            { text: 'Audit Record Schema', link: '/reference/audit-schema' },
            { text: 'REST API (Daemon)', link: '/reference/rest-api' },
          ],
        },
      ],
      '/governance/': [
        {
          text: 'Governance',
          items: [
            { text: 'Overview', link: '/governance/' },
            { text: 'License', link: '/governance/license' },
            { text: 'Compliance Posture', link: '/governance/compliance' },
            { text: 'Audit-Log Retention', link: '/governance/retention' },
            { text: 'SOC 2 Scope', link: '/governance/soc2' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/decisionplane' },
    ],

    footer: {
      message: `Released under the <a href="${base}governance/license">BSL-1.1 license</a>, converting to Apache-2.0 after 4 years.`,
      copyright: 'Copyright © 2026 DecisionPlane, Inc.',
    },

    editLink: {
      pattern: 'https://github.com/decisionplane/docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
