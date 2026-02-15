import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'FWD Thinking Solutions Blog',
    description: 'Web development case studies, tips, and insights from FWD Thinking Solutions in Norwich, Norfolk.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}`,
      categories: [
        post.data.category,
        ...(post.data.tags || []),
      ],
    })),
    customData: '<language>en-gb</language>',
  });
}
