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
- `robots.txt`: 搜索引擎抓取规则
- `sitemap.xml`: 站点地图
- `posts/_template.html`: 文章入口页模板
- `content/posts/_template.md`: Markdown 正文模板

## 搜索收录

目前站点已经具备被搜索引擎收录的基本条件：

- 站点是公开可访问的
- 没有 `noindex`
- 有 `robots.txt`
- 有 `sitemap.xml`

但 GitHub Pages 站点是否已经被搜到，还取决于搜索引擎何时抓取。

## 下次你自己发文章怎么做

下面这套就是你以后手动发文的标准流程。

### 更省事的方式：直接用脚手架命令

你现在也可以直接运行这个命令，让仓库先把文章骨架搭好：

```powershell
python tools/new_post.py `
  --slug "my-new-post" `
  --title "把这里改成文章标题" `
  --summary "这里写一段会出现在首页卡片和搜索描述里的摘要。" `
  --category "嵌入式" `
  --tags "STM32,调试,笔记" `
  --hero-kicker "STM32 / NOTES" `
  --hero-intro "这里写文章页顶部那段引导文案。"
```

这个命令会自动帮你：

- 新建正文文件
- 新建 `posts/<slug>.html`
- 新建 `assets/posts/<slug>/`
- 往 `data/posts.js` 里加一条元数据
- 往 `sitemap.xml` 里加一条新文章地址

如果你想先看看会改什么，不真正落盘，可以加：

```powershell
--dry-run
```

### 1. 确定一个 slug

比如这篇文章的 slug 是：

```text
winidea-open-debugging-guide
```

以后这个 slug 会同时出现在：

- `content/posts/<slug>.md` 或 `.html`
- `posts/<slug>.html`
- `data/posts.js`
- `sitemap.xml`
- 如果有配图，推荐放到 `assets/posts/<slug>/`

### 2. 新建正文文件

推荐两种方式：

- 普通技术文章：复制 `content/posts/_template.md`
- 图文排版更复杂：新建 `content/posts/<slug>.html`

如果你要加图片，推荐路径：

```text
assets/posts/<slug>/
```

这样后面不容易乱。

### 3. 新建文章入口页

复制：

```text
posts/_template.html
```

改成：

```text
posts/<slug>.html
```

然后至少改这几个地方：

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `data-post-slug`

### 4. 在 `data/posts.js` 里补一条元数据

按下面这些字段填：

- `slug`
- `title`
- `date`
- `summary`
- `tags`
- `category`
- `heroKicker`
- `heroIntro`
- `featured`
- `contentType`
- `contentPath`
- `path`

最稳妥的做法是直接复制现有文章对象，然后改成你的新内容。

### 5. 更新 `sitemap.xml`

在 `sitemap.xml` 里加一条新的 `<url>`，至少把新文章地址和日期补进去。

如果你用了 `python tools/new_post.py ...`，这一步会自动完成。

### 6. 本地自检

在仓库根目录运行：

```powershell
python -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

重点检查：

- 首页有没有出现新文章
- `archive.html` 有没有收进去
- `categories.html` 的分类和标签是否正常
- 文章页图片、标题、排版是否正常

### 7. 提交并推送

```powershell
git add .
git commit -m "Publish your post title"
git push origin main
```

推上去之后，GitHub Pages 会自动部署。

## Publish

Push to `main` and GitHub Pages will deploy the site.
