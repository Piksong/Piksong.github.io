import { posts } from "../data/posts.js";

const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

const pageType = document.body.dataset.page;

function createUrl(path) {
  return path.replace(/^\.\.\//, pageType === "post" ? "../" : "");
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(dateString));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const output = [];
  let inList = false;
  let inCodeBlock = false;
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) {
      output.push(`<p>${renderInlineMarkdown(text)}</p>`);
    }
    paragraph = [];
  }

  function closeList() {
    if (inList) {
      output.push("</ul>");
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      if (!inCodeBlock) {
        inCodeBlock = true;
        output.push("<pre><code>");
      } else {
        inCodeBlock = false;
        output.push("</code></pre>");
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(`${escapeHtml(rawLine)}\n`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      closeList();
      output.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      closeList();
      output.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      closeList();
      output.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (!inList) {
        output.push("<ul>");
        inList = true;
      }
      output.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${renderInlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    if (line === "---") {
      flushParagraph();
      closeList();
      output.push("<hr />");
      continue;
    }

    paragraph.push(renderInlineMarkdown(line));
  }

  flushParagraph();
  closeList();

  return output.join("");
}

function stripLeadingH1(html) {
  return html.replace(/^\s*<h1>.*?<\/h1>\s*/i, "");
}

function getPostBySlug(slug) {
  return sortedPosts.find((post) => post.slug === slug);
}

function getRelativePath(postPath) {
  return pageType === "post" ? postPath : postPath.replace(/^\.\.\//, "");
}

function createTagLink(tag) {
  return `categories.html?tag=${encodeURIComponent(tag)}`;
}

function createCategoryLink(category) {
  return `categories.html?category=${encodeURIComponent(category)}`;
}

function renderPostCard(post, featured = false) {
  return `
    <article class="post-card${featured ? " featured" : ""}">
      <p class="post-meta">${formatDate(post.date)} / ${post.category}</p>
      <h3>${post.title}</h3>
      <p>${post.summary}</p>
      <div class="card-tags">
        ${post.tags.map((tag) => `<a class="tag tag-inline" href="${createTagLink(tag)}">${tag}</a>`).join("")}
      </div>
      <a href="${getRelativePath(post.path)}">阅读全文</a>
    </article>
  `;
}

function renderEmptyCard(title, description, actionLabel, actionHref) {
  return `
    <article class="post-card post-card-empty">
      <p class="post-meta">EMPTY SLOT</p>
      <h3>${title}</h3>
      <p>${description}</p>
      ${actionLabel && actionHref ? `<a href="${actionHref}">${actionLabel}</a>` : ""}
    </article>
  `;
}

function renderHomePage() {
  const recentPosts = document.getElementById("recent-posts");
  const featuredPosts = document.getElementById("featured-posts");

  if (!sortedPosts.length) {
    recentPosts.innerHTML = [
      renderEmptyCard("还没有文章", "把你的第一篇内容加到 `data/posts.js` 之后，这里会自动出现。"),
      renderEmptyCard("支持 Markdown", "常规文章建议放进 `content/posts/*.md`。"),
      renderEmptyCard("也支持 HTML", "展示型内容可以继续用 HTML 正文文件。")
    ].join("");
    featuredPosts.innerHTML = [
      renderEmptyCard("准备上传自己的内容", "现在首页已经是干净骨架，不会再展示默认示例文章。"),
      renderEmptyCard("下一步只需要补内容", "正文文件、文章入口页和一条元数据就够了。")
    ].join("");
    return;
  }

  const recentSelection = sortedPosts.slice(0, 3);
  const featuredSelection = sortedPosts.filter(
    (post) => post.featured && !recentSelection.some((recentPost) => recentPost.slug === post.slug)
  );

  recentPosts.innerHTML = recentSelection.map((post, index) => renderPostCard(post, index === 0)).join("");
  featuredPosts.innerHTML = featuredSelection.length
    ? featuredSelection.map((post) => renderPostCard(post, true)).join("")
    : renderEmptyCard("更多内容还在整理", "后面会把更完整的项目、调试记录和阶段性总结继续补进来。");
}

function renderArchivePage() {
  const summary = document.getElementById("archive-summary");
  const container = document.getElementById("archive-posts");

  if (!sortedPosts.length) {
    summary.innerHTML = "<p>目前还没有公开文章。</p>";
    container.innerHTML = `<article class="empty-state"><h2>归档还是空的</h2><p>等你把第一篇文章元数据加进来，这里就会开始按时间自动整理。</p></article>`;
    return;
  }

  summary.innerHTML = `<p>共 ${sortedPosts.length} 篇文章，按最新时间排序。</p>`;
  container.innerHTML = sortedPosts
    .map(
      (post) => `
        <article class="archive-item">
          <div class="archive-date">${formatDate(post.date)}</div>
          <div class="archive-content">
            <p class="post-meta">${post.category}</p>
            <h2><a href="${getRelativePath(post.path)}">${post.title}</a></h2>
            <p>${post.summary}</p>
            <div class="card-tags">
              <a class="tag" href="${createCategoryLink(post.category)}">${post.category}</a>
              ${post.tags.map((tag) => `<a class="tag" href="${createTagLink(tag)}">${tag}</a>`).join("")}
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function getSearchValue(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function renderCategoriesPage() {
  const selectedCategory = getSearchValue("category");
  const selectedTag = getSearchValue("tag");
  const categoryChips = document.getElementById("category-chips");
  const tagChips = document.getElementById("tag-chips");
  const summary = document.getElementById("filter-summary");
  const container = document.getElementById("filtered-posts");

  if (!sortedPosts.length) {
    categoryChips.innerHTML = "";
    tagChips.innerHTML = "";
    summary.innerHTML = "<p>还没有分类或标签。</p>";
    container.innerHTML = `<article class="empty-state"><h2>这里会在你发布文章后自动生成</h2><p>分类和标签不需要单独维护，都会从文章元数据里汇总出来。</p></article>`;
    return;
  }

  const categories = [...new Set(sortedPosts.map((post) => post.category))];
  const tags = [...new Set(sortedPosts.flatMap((post) => post.tags))];

  categoryChips.innerHTML = categories
    .map(
      (category) => `
        <a class="tag${selectedCategory === category ? " is-active" : ""}" href="${createCategoryLink(category)}">${category}</a>
      `
    )
    .join("");

  tagChips.innerHTML = tags
    .map(
      (tag) => `
        <a class="tag${selectedTag === tag ? " is-active" : ""}" href="${createTagLink(tag)}">${tag}</a>
      `
    )
    .join("");

  const filteredPosts = sortedPosts.filter((post) => {
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
    return matchesCategory && matchesTag;
  });

  const labels = [];
  if (selectedCategory) labels.push(`分类：${selectedCategory}`);
  if (selectedTag) labels.push(`标签：${selectedTag}`);

  summary.innerHTML = `
    <p>${labels.length ? `${labels.join(" / ")}，` : ""}共找到 ${filteredPosts.length} 篇文章。</p>
    <a class="tag tag-link" href="categories.html">清除筛选</a>
  `;

  container.innerHTML = filteredPosts.length
    ? filteredPosts
        .map(
          (post) => `
            <article class="archive-item">
              <div class="archive-date">${formatDate(post.date)}</div>
              <div class="archive-content">
                <p class="post-meta">${post.category}</p>
                <h2><a href="${getRelativePath(post.path)}">${post.title}</a></h2>
                <p>${post.summary}</p>
                <div class="card-tags">
                  ${post.tags.map((tag) => `<a class="tag" href="${createTagLink(tag)}">${tag}</a>`).join("")}
                </div>
              </div>
            </article>
          `
        )
        .join("")
    : `<article class="empty-state"><h2>还没有匹配的文章</h2><p>可以换一个分类或标签继续看看。</p></article>`;
}

function buildPostShell(post, bodyHtml, previousPost, nextPost) {
  return `
    <section class="post-hero">
      <p class="eyebrow">${post.heroKicker}</p>
      <h1>${post.title}</h1>
      <p>${post.heroIntro}</p>
      <div class="card-tags">
        <a class="tag" href="../categories.html?category=${encodeURIComponent(post.category)}">${post.category}</a>
        ${post.tags.map((tag) => `<a class="tag" href="../categories.html?tag=${encodeURIComponent(tag)}">${tag}</a>`).join("")}
      </div>
      <p class="post-date">${formatDate(post.date)}</p>
    </section>

    <article class="post-body">
      ${bodyHtml}
    </article>

    <section class="post-footer-nav">
      ${previousPost ? `<a class="post-nav-card" href="${previousPost.path}"><span>上一篇</span><strong>${previousPost.title}</strong></a>` : '<div class="post-nav-card is-empty"><span>上一篇</span><strong>已经到最早的文章了</strong></div>'}
      ${nextPost ? `<a class="post-nav-card" href="${nextPost.path}"><span>下一篇</span><strong>${nextPost.title}</strong></a>` : '<div class="post-nav-card is-empty"><span>下一篇</span><strong>已经到最新的文章了</strong></div>'}
    </section>
  `;
}

async function renderPostPage() {
  const slug = document.body.dataset.postSlug;
  const root = document.getElementById("post-root");
  const post = getPostBySlug(slug);

  if (!post) {
    document.title = "文章不存在 | Piksong Blog";
    root.innerHTML = `
      <section class="post-hero">
        <p class="eyebrow">404 / POST</p>
        <h1>这篇文章不存在</h1>
        <p>可能是链接写错了，或者这篇文章还没有发布。</p>
      </section>
    `;
    return;
  }

  const currentIndex = sortedPosts.findIndex((item) => item.slug === slug);
  const previousPost = sortedPosts[currentIndex + 1] || null;
  const nextPost = sortedPosts[currentIndex - 1] || null;

  const response = await fetch(post.contentPath.replace(/^\.\.\//, "../"));
  const rawContent = await response.text();
  const bodyHtml =
    post.contentType === "markdown" ? stripLeadingH1(markdownToHtml(rawContent)) : rawContent;

  document.title = `${post.title} | Piksong Blog`;
  root.innerHTML = buildPostShell(post, bodyHtml, previousPost, nextPost);
}

function init() {
  if (pageType === "home") {
    renderHomePage();
  } else if (pageType === "archive") {
    renderArchivePage();
  } else if (pageType === "categories") {
    renderCategoriesPage();
  } else if (pageType === "post") {
    renderPostPage();
  }
}

init();
