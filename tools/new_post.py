from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import textwrap
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
POSTS_JS = ROOT / "data" / "posts.js"
SITEMAP_XML = ROOT / "sitemap.xml"
POST_TEMPLATE = ROOT / "posts" / "_template.html"
MD_TEMPLATE = ROOT / "content" / "posts" / "_template.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scaffold a new blog post and update metadata files."
    )
    parser.add_argument("--slug", required=True, help="URL slug, for example my-new-post")
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--summary", required=True, help="Short summary for cards and meta description")
    parser.add_argument("--category", required=True, help="Primary category, for example 嵌入式")
    parser.add_argument("--tags", required=True, help="Comma-separated tags, for example STM32,调试,FreeRTOS")
    parser.add_argument("--hero-kicker", required=True, help="Short kicker shown above the post title")
    parser.add_argument("--hero-intro", required=True, help="Intro paragraph shown in the post hero")
    parser.add_argument(
        "--content-type",
        choices=("markdown", "html"),
        default="markdown",
        help="Source format for the post body",
    )
    parser.add_argument(
        "--date",
        default=dt.date.today().isoformat(),
        help="Publish date in YYYY-MM-DD format. Default: today.",
    )
    parser.add_argument(
        "--featured",
        action="store_true",
        help="Mark this post as featured on the home page",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be created or updated without writing files",
    )
    return parser.parse_args()


def ensure_valid_slug(slug: str) -> None:
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-")
    if not slug or any(ch not in allowed for ch in slug):
        raise SystemExit("Slug 只能包含小写字母、数字和连字符，例如 my-new-post。")


def ensure_valid_date(date_text: str) -> None:
    try:
        dt.date.fromisoformat(date_text)
    except ValueError as exc:
        raise SystemExit("日期格式必须是 YYYY-MM-DD。") from exc


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def build_post_entry(args: argparse.Namespace) -> str:
    tags = [tag.strip() for tag in args.tags.split(",") if tag.strip()]
    if not tags:
      raise SystemExit("至少要提供一个 tag。")

    lines = [
        "  {",
        f"    slug: {js_string(args.slug)},",
        f"    title: {js_string(args.title)},",
        f"    date: {js_string(args.date)},",
        f"    summary: {js_string(args.summary)},",
        "    tags: [" + ", ".join(js_string(tag) for tag in tags) + "],",
        f"    category: {js_string(args.category)},",
        f"    heroKicker: {js_string(args.hero_kicker)},",
        f"    heroIntro: {js_string(args.hero_intro)},",
        f"    featured: {'true' if args.featured else 'false'},",
        f"    contentType: {js_string(args.content_type)},",
        f"    contentPath: {js_string(f'../content/posts/{args.slug}.{content_extension(args.content_type)}')},",
        f"    path: {js_string(f'../posts/{args.slug}.html')}",
        "  }",
    ]
    return "\n".join(lines)


def content_extension(content_type: str) -> str:
    return "md" if content_type == "markdown" else "html"


def update_posts_js(existing: str, entry: str, slug: str) -> str:
    if f'slug: "{slug}"' in existing or f"slug: '{slug}'" in existing:
        raise SystemExit(f"data/posts.js 里已经存在 slug={slug}。")

    marker = "\n];"
    if marker not in existing:
        raise SystemExit("无法识别 data/posts.js 的当前结构。")

    prefix, suffix = existing.rsplit(marker, 1)
    has_existing_entries = "{" in prefix
    insertion = (",\n" if has_existing_entries else "\n") + entry + "\n"
    return prefix + insertion + "];" + suffix


def build_post_page(args: argparse.Namespace) -> str:
    template = read_text(POST_TEMPLATE)
    canonical = f"https://piksong.github.io/posts/{args.slug}.html"
    return (
        template.replace("把这里改成文章标题", args.title)
        .replace("把这里改成一句 60 到 120 字左右的文章摘要。", args.summary)
        .replace("https://piksong.github.io/posts/your-post-slug.html", canonical)
        .replace('data-post-slug="your-post-slug"', f'data-post-slug="{args.slug}"')
    )


def build_markdown_body(args: argparse.Namespace) -> str:
    template = read_text(MD_TEMPLATE)
    return template.replace("把这里改成文章标题", args.title, 1)


def build_html_body(args: argparse.Namespace) -> str:
    return textwrap.dedent(
        f"""\
        <p class="article-lead">
          先用一两句话说清楚这篇文章能帮读者解决什么问题。
        </p>

        <h2>先写一个小节标题</h2>

        <p>
          这里开始写正文。你可以继续加段落、图片、列表、表格，或者沿用现有文章的排版组件。
        </p>

        <h2>再写一个小节标题</h2>

        <p>
          如果你准备放截图，推荐放到 <code>assets/posts/{args.slug}/</code> 下面，然后在这里用相对路径引用。
        </p>
        """
    )


def update_sitemap(slug: str, date_text: str) -> str:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    ET.register_namespace("", ns["sm"])
    tree = ET.parse(SITEMAP_XML)
    root = tree.getroot()
    post_url = f"https://piksong.github.io/posts/{slug}.html"

    for url_node in root.findall("sm:url", ns):
        loc_node = url_node.find("sm:loc", ns)
        if loc_node is not None and loc_node.text == post_url:
            raise SystemExit(f"sitemap.xml 里已经存在 {post_url}。")

    new_url = ET.SubElement(root, "{http://www.sitemaps.org/schemas/sitemap/0.9}url")
    loc = ET.SubElement(new_url, "{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    loc.text = post_url
    lastmod = ET.SubElement(new_url, "{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod")
    lastmod.text = date_text
    changefreq = ET.SubElement(new_url, "{http://www.sitemaps.org/schemas/sitemap/0.9}changefreq")
    changefreq.text = "monthly"
    priority = ET.SubElement(new_url, "{http://www.sitemaps.org/schemas/sitemap/0.9}priority")
    priority.text = "0.8"

    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    return xml_bytes.decode("utf-8")


def main() -> int:
    args = parse_args()
    ensure_valid_slug(args.slug)
    ensure_valid_date(args.date)

    content_path = ROOT / "content" / "posts" / f"{args.slug}.{content_extension(args.content_type)}"
    post_page_path = ROOT / "posts" / f"{args.slug}.html"
    asset_dir = ROOT / "assets" / "posts" / args.slug

    for path in (content_path, post_page_path):
        if path.exists():
            raise SystemExit(f"{path.name} 已经存在，换一个 slug 或先手动处理。")

    updated_posts_js = update_posts_js(read_text(POSTS_JS), build_post_entry(args), args.slug)
    updated_sitemap = update_sitemap(args.slug, args.date)
    post_page = build_post_page(args)
    body = build_markdown_body(args) if args.content_type == "markdown" else build_html_body(args)

    print("Will create or update:")
    print(f"- {content_path.relative_to(ROOT)}")
    print(f"- {post_page_path.relative_to(ROOT)}")
    print(f"- {asset_dir.relative_to(ROOT)}/")
    print(f"- {POSTS_JS.relative_to(ROOT)}")
    print(f"- {SITEMAP_XML.relative_to(ROOT)}")

    if args.dry_run:
        print("\nDry run complete. No files were written.")
        return 0

    asset_dir.mkdir(parents=True, exist_ok=True)
    write_text(content_path, body)
    write_text(post_page_path, post_page)
    write_text(POSTS_JS, updated_posts_js)
    write_text(SITEMAP_XML, updated_sitemap)

    print("\nDone.")
    print("Next steps:")
    print(f"1. Write the body in {content_path.relative_to(ROOT)}")
    print(f"2. Put images into {asset_dir.relative_to(ROOT)}/")
    print("3. Preview locally with: python -m http.server 4173")
    print("4. Commit and push to main")
    return 0


if __name__ == "__main__":
    sys.exit(main())
