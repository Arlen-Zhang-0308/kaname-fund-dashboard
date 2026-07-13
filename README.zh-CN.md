# Kaname Fund Dashboard

[English](README.md) | **简体中文**

Kaname Fund Dashboard 是一个基于 Next.js 与 Vercel 的基金及投资组合仪表盘。本公开仓库仅包含应用代码与非敏感示例数据，不包含真实持仓或交易信息。

## 功能概览

- 展示主计划、独立追踪资产与已卖出记录。
- 汇总当前金额、持仓盈亏和已实现盈亏等指标。
- 通过服务端 API 统一提供完整投资组合状态与摘要数据。
- 支持 CORS 预检及跨域读取。
- 使用 PostgreSQL 持久化缩略图点赞计数。
- 未配置私有数据时自动回退到公开示例数据。

## 安全边界

**请勿提交真实的投资组合数据、交易记录、成本、份额、价格、密钥或后端凭据。**

真实投资组合数据必须在运行时通过 Vercel 环境变量 `PORTFOLIO_STATE_JSON` 提供，内容为完整的私有投资组合 JSON 字符串。缺少该变量或 JSON 解析失败时，应用会回退到 `data/portfolio-state.example.json`。

本地环境文件（例如 `.env.local`）不得提交到 Git 仓库。

## 技术架构

- **前端：** Next.js 14 App Router、React 18、TypeScript。
- **后端：** Next.js Route Handlers，部署为 Vercel Serverless API。
- **公开示例数据：** `data/portfolio-state.example.json`。
- **私有生产数据：** `PORTFOLIO_STATE_JSON` 环境变量。
- **点赞数据：** PostgreSQL 表 `thumbnail_likes`，由接口首次调用时自动创建。
- **分析：** Vercel Analytics。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/portfolio` | 返回完整投资组合状态。 |
| `GET` | `/api/portfolio/summary` | 返回仪表盘摘要指标及当前数据来源。 |
| `GET` | `/api/cors-test` | 检查服务连通性与 CORS 配置。 |
| `OPTIONS` | 上述 GET 路径 | 处理 CORS 预检请求。 |
| `GET` | `/api/thumbnail?targetId=<id>` | 获取指定目标的点赞状态与累计数量。 |
| `POST` | `/api/thumbnail` | 为请求体中的 `targetId` 增加一次点赞。 |

点赞请求示例：

```bash
curl -X POST http://localhost:3000/api/thumbnail \
  -H 'Content-Type: application/json' \
  -d '{"targetId":"dashboard-cover"}'
```

`targetId` 会去除首尾空白并截断至 100 个字符；缺失或为空时使用 `default`。

## 环境变量

复制示例配置并按需填写：

```bash
cp .env.example .env.local
```

| 变量 | 是否必需 | 说明 |
| --- | --- | --- |
| `PORTFOLIO_STATE_JSON` | 否 | 完整的私有投资组合 JSON；未配置时使用公开示例数据。 |
| `POSTGRES_URL` | 点赞接口必需 | PostgreSQL 连接字符串，优先使用。 |
| `POSTGRES_PRISMA_URL` | 可选回退 | `POSTGRES_URL` 不存在时使用。 |
| `POSTGRES_URL_NON_POOLING` | 可选回退 | 前两项均不存在时使用。 |

如果未配置任何 PostgreSQL 连接变量，投资组合页面与相关 API 仍可运行，但 `/api/thumbnail` 会返回数据库配置错误。

## 本地开发

环境要求：Node.js 18.17 或更高版本，以及 npm。

```bash
npm install
npm run dev
```

访问 <http://localhost:3000> 查看仪表盘。

常用命令：

```bash
npm run dev    # 启动开发服务器
npm run lint   # 运行代码检查
npm run build  # 创建生产构建
npm run start  # 启动生产服务器
```

## 部署到 Vercel

1. 将仓库导入 Vercel。
2. 在项目设置中配置 `PORTFOLIO_STATE_JSON`。
3. 如需启用点赞接口，连接 PostgreSQL 或 Supabase，并配置可用的 PostgreSQL 连接变量。
4. 使用以下命令构建：

```bash
npm run build
```

## 数据格式

`PORTFOLIO_STATE_JSON` 应与 `data/portfolio-state.example.json` 的结构保持一致，主要包含：

- 估值快照时间、币种与 schema 版本；
- 当前总成本、当前总金额和持仓盈亏；
- `holdings`：主计划及独立追踪资产；
- `sold_positions`：已卖出记录；
- 计算口径说明。

修改数据结构时，应同步更新 `lib/portfolio.ts` 中的 TypeScript 类型及示例数据。
