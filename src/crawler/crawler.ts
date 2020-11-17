import * as cheerio from 'cheerio';
import axios from 'axios';

// mangareader site
const MANGA_READER_SITE = 'https://www.mangareader.net';

function toDashCase(str) {
  str = str
    .toLowerCase()
    .replace(/[\s!,:-]/g, '-')
    .replace(/-{2,}|-$/, '-');
  if (str.lastIndexOf('-') === str.length - 1)
    str = str.substring(0, str.length - 1);
  return str;
}
export default class MangaScraper {
  body;
  queue;
  $;

  constructor() {}

  async loadUrl(url: string) {
    const { data: webpage } = await axios.get(url);
    this.$ = cheerio.load(webpage);
    this.body = this.$('#main');
  }

  getElementBySelector(selector: string) {
    return this.body.find(selector);
  }

  getElementAttribute(element, attribute: string) {
    return element.attr(attribute);
  }

  getPaginatedTopViewUrl(page: string) {
    if (page == '1') page = '';
    else page = ((parseInt(page) - 1) * 30).toString();

    return `${MANGA_READER_SITE}/popular/${page}`;
  }

  getSearchUrl(searchQuery: string) {
    return `${MANGA_READER_SITE}/search/?w=${searchQuery}`;
  }

  addUrlToQueue(urls) {
    this.queue = [...urls, ...this.queue];
  }

  extractMangaDetailsFromTopViewUrl() {
    const extractDetails = element => {
      const title = element
        .find('.d42')
        .text()
        .trim();
      const coverImageUrl = element.find('.d41').attr('data-src');
      const url = element.find('.d42 a').attr('href');
      const author = element
        .find('.d43')
        .text()
        .trim();
      const tags = element
        .find('.d46')
        .text()
        .trim()
        .split(', ');

      return {
        title,
        coverImageUrl: `https://${coverImageUrl.substring(
          2,
          coverImageUrl.length,
        )}`,
        url: `${MANGA_READER_SITE}${url}`,
        tags,
        author,
        synopsis: '',
        slug: toDashCase(title),
      };
    };

    let mangas = [];
    this.body.find('.d39 table tbody tr').each((i, element) => {
      const elementSelector = this.$(element);
      mangas.push(extractDetails(elementSelector));
    });

    console.log('mangas', mangas);
    return mangas;
  }

  extractMangaDetailsFromSearchUrl() {
    const extractDetails = element => {
      const title = element
        .find('.d57 a')
        .text()
        .trim();
      const coverImageUrl = element.find('.d56').attr('data-src');
      const url = element.find('.d57 a').attr('href');
      const author = '';
      const tags = element
        .find('.d60')
        .text()
        .trim()
        .split(', ');

      return {
        title,
        coverImageUrl: `https://${coverImageUrl.substring(
          2,
          coverImageUrl.length,
        )}`,
        url: `${MANGA_READER_SITE}${url}`,
        tags,
        author,
        synopsis: '',
        slug: toDashCase(title),
      };
    };

    let mangas = [];
    this.body.find('.d52 .d54').each((i, element) => {
      const elementSelector = this.$(element);
      mangas.push(extractDetails(elementSelector));
    });

    return mangas;
  }

  extractAdditionalMangaDetailsFromChapter() {
    const mangaCover = this.body.find('.d38 img').attr('src');
    const mangaSynopsis = this.body
      .find('.d46 p')
      .text()
      .trim();
    const mangaDetails = {
      mangaCover,
      mangaSynopsis,
    };

    return mangaDetails;
  }
  extractChaptersFromManga(mangaId: string, mangaSlug: string) {
    const title = this.body
      .find('.d41 .name')
      .text()
      .trim();

    const extractChapterDetails = element => {
      // Get the first column of the row
      const chapterElement = element.find('td').first();

      const anchorTag = chapterElement.find('a');
      let label = `${chapterElement
        .text()
        .trim()
        .replace(title, 'Chapter')
        .replace(' :', ':')}`;
      if (label.indexOf(':') + 1 === label.length)
        label = label.replace(':', '');

      const url = anchorTag.attr('href');

      return {
        label,
        url: `${MANGA_READER_SITE}${url}`,
        slug: toDashCase(label),
      };
    };

    // d49 is table headers
    const chapters = this.body.find('.d48 tbody tr:not(.d49)');
    let chapterDetails = [];

    chapters.each((i: number, element) => {
      const elementSelector = this.$(element);
      chapterDetails.push({
        ...extractChapterDetails(elementSelector),
        sequence: i,
        mangaId,
        mangaSlug,
      });
    });
    return chapterDetails;
  }

  extractPagesFromChapter(mangaId: string, chapterSlug: string) {
    // Mangareader does not instanly inject image urls in the dom
    // So we can't extract them from html > img elements
    // However they are visible through the scripts with the intent
    // of preloading
    const scripts = this.$('script').get();
    const parsedUrlsData = (() => {
      const data = scripts[1].children[0].data;
      return JSON.parse(data.replace('document["mj"]=', ''));
    })();

    const chapterPages = parsedUrlsData.im.map(({ u: img }, index) => {
      return {
        url: `https://${img.substring(2, img.length)}`,
        sequence: index,
        mangaId,
        chapterSlug,
      };
    });

    return chapterPages;
  }
}
