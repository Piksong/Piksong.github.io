# myblog.github.io

Personal blog hosted with GitHub Pages.

## Structure

- `index.html`: 首页，渲染最近文章和推荐阅读
- `archive.html`: 全部文章归档
- `categories.html`: 分类和标签浏览
- `data/posts.js`: 统一文章元数据
- `content/posts/*.md`: Markdown 文章正文
- `content/posts/*.html`: HTML 文章正文
- `posts/<slug>.html`: 独立文章入口页
- `scripts/blog.js`: 统一渲染逻辑
- `styles.css`: 共用视觉样式

## Add A New Post

1. 在 `content/posts/` 下新建正文文件。
   - 常规文章推荐用 Markdown
   - 展示型内容可以用 HTML
2. 在 `posts/` 下新建一个对应的 `<slug>.html` 入口页。
   - 复制现有文章页壳
   - 把 `data-post-slug` 改成新文章的 slug
3. 在 `data/posts.js` 里补一条元数据：
   - `slug`
   - `title`
   - `date`
   - `summary`
   - `tags`
   - `category`
   - `contentType`
   - `contentPath`
   - `path`

## Publish

Push to `main` and GitHub Pages will deploy the site.
