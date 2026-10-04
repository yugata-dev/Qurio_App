# Tree for frontend folder

```text
frontend/
|-- .env.example
|-- .env.local
|-- .gitignore
|-- README.md
|-- app/
|   |-- (auth)/
|   |   |-- login/
|   |   |   `-- page.tsx
|   |   `-- register/
|   |       `-- page.tsx
|   |-- (workspace)/
|   |   |-- analytics/
|   |   |   `-- page.tsx
|   |   |-- dashboard/
|   |   |   |-- createpolls/
|   |   |   |   `-- [id]/
|   |   |   |       `-- page.tsx
|   |   |   |-- createsessions/
|   |   |   |   `-- page.tsx
|   |   |   |-- page.tsx
|   |   |   |-- session/
|   |   |   |   |-- [id]/
|   |   |   |   |   |-- page.tsx
|   |   |   |   |   `-- poll/
|   |   |   |   |       `-- [pollId]/
|   |   |   |   |           |-- qa/
|   |   |   |   |           |   `-- page.tsx
|   |   |   |   |           `-- wordcloud/
|   |   |   |   |               `-- page.tsx
|   |   |   |-- sessions/
|   |   |   |   `-- page.tsx
|   |   |   `-- layout.tsx
|   |-- play/
|   |   `-- [id]/
|   |       `-- page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components.json
|-- endpoint-list.locally.md
|-- eslint-err.txt
|-- eslint-out.txt
|-- eslint.config.mjs
|-- middleware.ts
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- shadcn-add.log
|-- tree.txt
|-- tsconfig.json
|-- tsconfig.tsbuildinfo
|-- components/
|   |-- ui/
|   |   |-- alert-dialog.tsx
|   |   |-- alert.tsx
|   |   |-- badge.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- chart.tsx
|   |   |-- context-menu.tsx
|   |   |-- dialog.tsx
|   |   |-- dropdown-menu.tsx
|   |   |-- input-group.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- select.tsx
|   |   |-- separator.tsx
|   |   |-- skeleton.tsx
|   |   |-- table.tsx
|   |   |-- tabs.tsx
|   |   |-- textarea.tsx
|   |   `-- toast.tsx
|   |-- AccessForm.tsx
|   |-- CopyButton.tsx
|   |-- QuizView.tsx
|   |-- SettingsModal.tsx
|   `-- ThemeProvider.tsx
|-- context/
|   `-- AuthContext.tsx
|-- lib/
|   |-- api.tsx
|   |-- db.ts
|   |-- smart-search.ts
|   `-- utils.ts
`-- public/
    |-- qurio.png
    `-- qurio_ramping.png
```

> folder frontend bukan folder root proyek, tapi folder frontend berada di dalam folder root proyek
