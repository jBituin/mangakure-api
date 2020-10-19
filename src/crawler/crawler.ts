import cheerio from 'cheerio';
import axios from 'axios';
import { Manga } from '../manga/interfaces/manga.interface';

export function neloCrawler() {
  let body;
  let queue;

  function getElementBySelector(selector: string) {
    return body.find(selector).html();
  }

  async function loadUrl(url: string) {
    const { data: webpage } = await axios.get(url);
    const $ = cheerio.load(webpage);
    body = $('div[class="body-site"]');
  }

  function addUrlToQueue(urls) {
    const s = '';
    queue = [...urls, ...queue];
  }
}
// export class Crawler {
//   #queue;
//   #body;

//   constructor() {}

//   getElementBySelector(selector: string) {
//     return this.#body.find(selector).html;
//   }

//   async loadUrl(url: string) {
//     const { data: webpage } = await axios.get(url)
//     const $ = cheerio.load(webpage)
//     this.#body = $('div[class="body-site"]')
//   }

//   addUrlToQueue(urls) {
//     this.#queue = [...urls, ...this.#queue]
//   }
// }
