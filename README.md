# Logic Model Builder

This project is a React + Vite application that helps teams design and document a logic model (theory of change / effektlogik) for their project. It offers drag-and-drop editing through React Flow, bilingual labels (English/Swedish), template starters, and export to JSON, PNG, or PDF.

## Getting started

```bash
npm install
npm run dev
```

> **Note:** If installing dependencies from npm fails due to a restricted mirror, configure npm to use the public registry, for example:
>
> ```bash
> npm set registry https://registry.npmjs.org/
> ```

Once the development server is running, open the printed local URL in your browser.

## Available scripts

- `npm run dev` – start the Vite development server
- `npm run build` – build the production bundle
- `npm run preview` – preview the production bundle locally

## Key features

- Predefined templates and example logic model to get started quickly
- Drag-and-drop authoring with React Flow, including custom-styled nodes for the core logic model steps
- Sidebar editor for descriptions, indicators, data sources, and assumptions (per node and per connection)
- Language toggle between English and Swedish labels/content
- Export current model structure to JSON, and capture the diagram as PNG or PDF via `html-to-image` + `jsPDF`

## Project structure

```
├── index.html
├── package.json
├── postcss.config.js
├── public/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   └── Sidebar.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── nodes/
│   │   └── LogicNode.jsx
│   └── utils/
│       ├── exporters.js
│       └── templates.js
└── tailwind.config.js
```

## Deployment

The app is built with Vite and does not rely on a backend, so it can be deployed on static hosts such as Netlify or Vercel. Build the project with `npm run build` and deploy the generated `dist/` directory.
