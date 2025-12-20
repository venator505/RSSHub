import { load } from 'cheerio';

import type { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';

export const route: Route = {
    path: '/zhengce/jiedu/',
    categories: ['government'],
    example: '/gov/zhengce/jiedu',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.gov.cn/'],
            target: '/zhengce/jiedu',
        },
    ],
    name: '政策解读',
    maintainers: ['venator505'],
    handler,
    url: 'www.gov.cn/',
};

async function handler() {
    const link = 'https://www.gov.cn/zhengce/jiedu/';
    const res = await ofetch(link);
    const $ = load(res.data);

    const list = $('body > div.news_box > li')
        .toArray()
        .map((elem) => {
            elem = $(elem);
            return {
                title: elem.find('a').text(),
                link: elem.find('a').attr('href'),
                pubDate: timezone(parseDate(elem.find('.date').text()), 8),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const contentData = await got(item.link);
                const $ = load(contentData.data);
                item.description = $('#UCAP-CONTENT').html();
                return item;
            })
        )
    );

    return {
        title: '政策解读 - 中国政府网',
        link: res.url,
        item: items,
    };
}
