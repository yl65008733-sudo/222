# 我们的旅行纪念册

一个私下分享给朋友看的旅行纪念网站。现在的框架是：

- 首页先看到整体标题和四个城市入口：台州、南京、重庆、南昌。
- 点击城市后进入该城市详情。
- 每个城市下面按片段展示照片和简短文字。
- 每个片段下面都有评论区，也预留了发照片的位置。

## 本地运行

```bash
npm install
npm run dev
```

## 更新内容

旅行内容在 `src/data/trips.js`，照片放在 `public/photos/`。

以后新增旅行时，主要补这些：

- `city`：城市名
- `date`：月份
- `title`：这次旅行的标题
- `intro`：城市详情页开头的一段话
- `chapters`：下面的不同片段，比如吃饭、景点、日常、KTV
- `photos`：每个片段里的照片路径和说明

## Supabase 评论和照片

执行 `supabase/schema.sql` 可以创建评论表和照片上传 bucket。

需要配置环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

如果没有配置 Supabase，网站仍然可以预览，评论和上传照片会以本地预览方式显示。

## 部署

Vercel 设置：

- Build command: `npm run build`
- Output directory: `dist`

网站默认设置了 `noindex, nofollow`，适合私下分享链接。
