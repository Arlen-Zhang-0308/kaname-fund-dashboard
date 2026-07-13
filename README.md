# Kaname Fund Dashboard

[English](README.md) | [简体中文](README.zh-CN.md)

A Next.js/Vercel fund dashboard service. This public repository contains only application code and non-sensitive example data.

## Security boundary

Do **not** commit real portfolio data, transaction data, costs, units, prices, secrets, or backend credentials.

Real data must be supplied at runtime through Vercel Environment Variables:

- `PORTFOLIO_STATE_JSON`: complete private portfolio JSON string.

The app falls back to `data/portfolio-state.example.json` when the environment variable is missing.

## Architecture

- Frontend: Next.js App Router dashboard UI.
- Backend: Vercel Serverless API routes.
- Public sample data: `data/portfolio-state.example.json`.
- Private production data: `PORTFOLIO_STATE_JSON` environment variable.

## API

- `GET /api/portfolio` returns the portfolio state.
- `GET /api/portfolio/summary` returns dashboard summary metrics.

## Local development

```bash
npm install
npm run dev
```

For private local testing, create `.env.local` and set `PORTFOLIO_STATE_JSON`. Never commit `.env.local`.

## Production

Vercel builds with:

```bash
npm run build
```
