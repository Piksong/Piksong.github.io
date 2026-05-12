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

function renderHomePage() {
  const recentPosts = document.getElementById("recent-posts");
  const featuredPosts = document.getElementById("featured-posts");

  recentPosts.innerHTML = sortedPosts.slice(0, 3).map((post, index) => renderPostCard(post, index === 0)).join("");
  featuredPosts.innerHTML = sortedPosts.filter((post) => post.featured).map((post) => renderPostCard(post, true)).join("");
}

function renderArchivePage() {
  const summary = document.getElementById("archive-summary");
  const container = document.getElementById("archive-posts");

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
