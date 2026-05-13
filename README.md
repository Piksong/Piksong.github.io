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

## 和 Obsidian 知识库怎么结合

可以结合，而且很适合结合，但我更推荐“内容联动，仓库分离”：

- 知识库继续放在 `E:\PLF_knowlege_base`
- 公开 blog 仓库继续放在 `E:\CdodeX_workspace\myblog.github.io`
- Obsidian 负责写原始笔记、学习记录、草稿
- blog 仓库负责放最终公开版本

这样做的好处：

- 不容易把整个私有知识库误传到公开仓库
- Obsidian 里可以保留半成品、私人想法和内部笔记
- blog 仓库只保留已经整理好的公开内容
- AI IDE 可以同时读取知识库和 blog 仓库，做“分析 -> 改写 -> 发布”

### 推荐工作流

最稳的工作流是：

1. 在 Obsidian 知识库里先写原始笔记
   - 例如放到 `E:\PLF_knowlege_base\Second_brain\Notes\ISYSTEM\`
2. 用 AI IDE 基于原始笔记整理出适合公开的版本
3. 把公开版落到 blog 仓库
   - 正文：`content/posts/`
   - 配图：`assets/posts/<slug>/`
   - 入口页：`posts/<slug>.html`
   - 元数据：`data/posts.js`
4. 本地预览后再 `git push origin main`

### 不推荐的做法

不推荐直接把整个 `E:\PLF_knowlege_base` 当成公开 blog 仓库来推送，因为：

- 很容易把私人笔记、草稿、客户信息一起带出去
- Obsidian 知识库里的文件组织方式，不一定适合直接公开
- blog 需要更稳定的 slug、图片目录和文章入口页结构

### 如果以后真的想物理合并

如果你后面确定要把 blog 移进知识库，建议至少保持这个边界：

```text
E:\PLF_knowlege_base\Second_brain\Notes\
  Blog\
    myblog.github.io\
```

不要直接把整个 `Notes` 根目录当成 GitHub Pages 仓库。

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
winidea-debugging-guide
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
