# 我们的旅行纪念册

一个私下分享给朋友看的旅行时间线网站。第一版包含精选旅行记录、轻量照片墙和 Supabase 留言墙。

## 本地运行

```bash
npm install
npm run dev
```

## 更新旅行内容

旅行内容在 `src/data/trips.js`。每次新增旅行时，补充：

- `title`：旅行标题
- `date`：日期
- `location`：地点
- `summary`：几句回忆
- `highlight`：一个高光瞬间
- `people`：参与朋友
- `photos`：照片路径

精选照片建议放在 `public/photos/`。例如：

```js
photos: [
  {
    src: "/photos/hangzhou-lake.jpg",
    alt: "杭州西湖边的合照",
    caption: "傍晚的风刚刚好"
  }
]
```

## 连接 Supabase 留言墙

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 复制 `.env.example` 为 `.env`，填入 Supabase Project URL 和 anon public key。
4. 重新运行网站。

## 部署

推荐 Vercel 或 Netlify：

- Build command: `npm run build`
- Output directory: `dist`
- 环境变量：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`

这个站点默认设置了 `noindex, nofollow`，更适合私下分享链接。
