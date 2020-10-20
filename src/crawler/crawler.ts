import * as cheerio from 'cheerio';
import axios from 'axios';

// Manganelo site
export default class NeloScraper {
  body;
  queue;
  $;

  constructor() {}

  async loadUrl(url: string) {
    const { data: webpage } = await axios.get(url);
    // console.log('webpage', webpage);
    this.$ = cheerio.load(webpage);
    this.body = this.$('div[class="body-site"]');
  }

  getElementBySelector(selector: string) {
    return this.body.find(selector);
  }

  getElementAttribute(element, attribute: string) {
    return element.attr(attribute);
  }

  getPaginatedTopViewUrl(page: string | number) {
    if (page == 1) page = '';
    return `https://manganelo.com/genre-all/${page}?type=topview`;
  }

  addUrlToQueue(urls) {
    this.queue = [...urls, ...this.queue];
  }

  extractMangaDetailsFromTopViewUrl() {
    const extractDetails = element => {
      const title = element
        .find('.genres-item-name')
        .text()
        .trim();
      const url = element.find('.genres-item-name').attr('href');
      const coverImageUrl = element.find('.img-loading').attr('src');

      return {
        title,
        coverImageUrl,
        url,
      };
    };

    let mangas = [];
    this.body.find('.content-genres-item').each((i, element) => {
      const elementSelector = this.$(element);
      mangas.push(extractDetails(elementSelector));
    });

    console.log('mangas', mangas);
    return mangas;
  }

  extractChaptersFromManga(mangaId) {
    const extractChapterDetails = element => {
      const chapterNameElement = element.find('.chapter-name');

      const label = chapterNameElement.text().trim();
      const url = chapterNameElement.attr('href');

      if (!url) {
        console.log('url', url);
        console.log('label', label);
      }
      return {
        label,
        url,
      };
    };

    const chapters = this.body.find('li.a-h');
    let details = [];

    chapters.each((i, element) => {
      const elementSelector = this.$(element);
      details.push({
        ...extractChapterDetails(elementSelector),
        sequence: i,
        mangaId,
      });
    });
    console.log('details', details);
    return details;
  }

  extractImagesFromChapter(chapterId) {
    const extractChapterImages = element => {
      const url = element.attr('href');

      return {
        url,
      };
    };

    const images = this.body.find('.container-chapter-reader img');
    let details = [];

    images.each((i, element) => {
      const elementSelector = this.$(element);
      details.push({
        ...extractChapterImages(elementSelector),
        sequence: i,
        chapterId,
      });
    });
    console.log('details', details);
    return details;
  }
}
