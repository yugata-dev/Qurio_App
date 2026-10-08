# Tree for project

```text
├── .github/
│   └── instructions/
│       ├── intruksi-qurio-frontend.instructions.md
│       └── tree.md.instructions.md
├── .postman/
│   └── resources.yaml
├── .vscode/
│   ├── mcp.json
│   └── settings.json
├── backend/
│   ├── scripts/
│   │   ├── run-migration.js
│   │   └── seed-analytics.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database/
│   │   │       └── connection.js
│   │   ├── controllers/
│   │   │   ├── analytics.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── participants.controller.js
│   │   │   ├── polls.controller.js
│   │   │   ├── questions.controller.js
│   │   │   ├── responses.controller.js
│   │   │   ├── sessions.controller.js
│   │   │   └── wordcloud.controller.js
│   │   ├── db/
│   │   │   └── migrations/
│   │   │       ├── 001_schema.sql
│   │   │       ├── 002_add_class_size.sql
│   │   │       ├── 003_require_class_size.sql
│   │   │       └── 004_session_mode.sql
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js
│   │   └── routes/
│   │       ├── analytics.route.js
│   │       ├── auth.route.js
│   │       ├── polls.route.js
│   │       ├── questions.route.js
│   │       ├── responses.route.js
│   │       ├── sessions.route.js
│   │       └── wordcloud.route.js
│   ├── .env
│   ├── .env .example
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── docs/
│   └── postman/
│       └── globals/
│           └── workspace.globals.yaml
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (workspace)/
│   │   │   ├── analytics/
│   │   │   │   ├── interactive/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── quiz/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── createsessions/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── session/
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── create-poll/
│   │   │   │   │       ├── poll/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── play/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input-group.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── toast.tsx
│   │   ├── AccessForm.tsx
│   │   ├── CopyButton.tsx
│   │   ├── QuizView.tsx
│   │   ├── SettingsModal.tsx
│   │   └── ThemeProvider.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.tsx
│   │   ├── db.ts
│   │   ├── export-pdf.ts
│   │   ├── smart-search.ts
│   │   └── utils.ts
│   ├── public/
│   │   └── Qurio-Cropped.svg
│   ├── types/
│   │   └── jspdf.d.ts
│   ├── .env.example
│   ├── .env.local
│   ├── .gitignore
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── middleware.ts
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── shadcn-add.log
│   ├── tsconfig.json
│   └── tsconfig.tsbuildinfo
├── postman/
│   └── globals/
│       └── workspace.globals.yaml
├── .gitattributes
├── .gitignore
├── package.json
├── tree.txt
└── vercel.json

```
