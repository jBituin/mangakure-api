import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery, Types, Error } from 'mongoose';

import { Pagination, PaginationOptionsInterface } from '../paginate';

import { Manga } from './interfaces/manga.interface';

import { Search } from './interfaces/search.interface';

import { SearchDTO } from './dto/search.dto';
import { CreateMangaDTO } from './dto/manga.dto';

import MangaScraper from '../crawler';

const MANGA_STATUS = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
};

@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
    @InjectModel('Search') private readonly searchModel: Model<Search>,
  ) {}

  async getAllManga(
    options?: PaginationOptionsInterface,
  ): Promise<Pagination<Manga>> {
    let { limit, page, search } = options;

    // setting default values
    if (!limit) limit = 100;
    if (!page) page = 1;

    let hasBeenSearched: boolean = false;

    try {
      if (search) {
        hasBeenSearched = !!(await this.searchModel.findOne({
          query: search,
        }));

        if (!hasBeenSearched) {
          const mangaScraper = new MangaScraper();
          const url = mangaScraper.getSearchUrl(search);
          await mangaScraper.loadUrl(url);
          const newMangas = mangaScraper.extractMangaDetailsFromSearchUrl();

          const newSearch: SearchDTO = {
            query: search,
          };
          await new this.searchModel(newSearch).save();

          try {
            await this.mangaModel.insertMany(newMangas, {
              ordered: false,
            });
          } catch (err) {}
        }
      }

      const aggregate = this.mangaModel.aggregate();

      // Exclude id and url fields
      aggregate.project({
        _id: false,
        url: false,
        last_sync: false,
        created_at: false,
        chapters: false,
      });

      // aggregate.lookup({
      //   from: 'chapters',
      //   let: {
      //     mangaSlug: '$slug',
      //     sequence: '$sequence',
      //     title: '$title',
      //   },
      //   pipeline: [
      //     {
      //       $match: {
      //         $and: [
      //           {
      //             $expr: {
      //               $and: [{ $eq: ['$mangaSlug', '$$mangaSlug'] }],
      //             },
      //           },
      //         ],
      //       },
      //     },
      //     {
      //       $sort: {
      //         sequence: -1,
      //       },
      //     },
      //     {
      //       $limit: 1,
      //     },
      //   ],
      //   as: 'latestChapters',
      // });

      if (search) {
        aggregate.match({
          title: {
            $regex: search,
            $options: 'i',
          },
        });
      }

      aggregate.facet({
        mangas: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
        ],
        total: [{ $count: 'total' }],
      });

      aggregate.addFields({
        total: {
          $ifNull: [
            {
              $arrayElemAt: ['$total.total', 0],
            },
            0,
          ],
        },
      });

      const [{ mangas, total }] = await aggregate.exec();

      return new Pagination<Manga>({
        results: mangas,
        total,
        page,
        pageSize: Math.round(parseInt(total) / limit),
      });
    } catch (err) {
      console.log('err', err);
    }
  }

  async getManga(mangaId: MongooseFilterQuery<'_id'>): Promise<Manga> {
    const manga = await this.mangaModel.findOne(mangaId).exec();
    return manga;
  }

  async addManga(createMangaDTO: CreateMangaDTO): Promise<Manga> {
    const newManga = await new this.mangaModel(createMangaDTO).save();
    return newManga;
  }

  async updateManga(mangaID, createMangaDTO: CreateMangaDTO): Promise<Manga> {
    const updatedManga = await this.mangaModel.findByIdAndUpdate(
      mangaID,
      createMangaDTO,
      { new: true },
    );
    return updatedManga;
  }

  async deleteManga(mangaID): Promise<any> {
    const deletedManga = await this.mangaModel.findByIdAndRemove(mangaID);
    return deletedManga;
  }

  async getChapterPages(mangaSlug: string, chapterSlug: string): Promise<any> {
    const manga = await this.mangaModel.findOne(
      {
        'chapters.slug': chapterSlug,
      },
      {
        chapters: {
          $elemMatch: {
            slug: chapterSlug,
          },
        },
      },
    );

    const chapter = manga.chapters[0];

    // TODO: ERROR HANDLING
    if (!chapter) return [];

    let chapterPages = chapter?.pages;

    if (!chapterPages.length) {
      const mangaScraper = new MangaScraper();
      await mangaScraper.loadUrl(chapter.url);
      chapterPages = mangaScraper.extractPagesFromChapter();

      manga.chapters[0].pages.push(...chapterPages);
      await manga.save();
    }

    return chapterPages;
  }

  async getMangaChapters(mangaSlug): Promise<any> {
    const manga = await this.mangaModel.findOne({
      slug: mangaSlug,
    });

    if (!manga) return null;

    let { chapters } = manga;

    if (!chapters.length) {
      const mangaScraper = new MangaScraper();
      await mangaScraper.loadUrl(manga.url);

      chapters = mangaScraper.extractChaptersFromManga().reverse();

      manga.chapters.push(...chapters);
      await manga.save();
    } else {
      if (manga.status === MANGA_STATUS.ONGOING) {
        const { last_sync: lastSync, url } = manga;
        const ONE_DAY = 3600 * 1000 * 24;
        if (new Date().getTime() - new Date(lastSync).getTime() > ONE_DAY) {
          const mangaScraper = new MangaScraper();
          await mangaScraper.loadUrl(url);

          const newChapters = mangaScraper.extractLatestMangaChapters(
            chapters,
            manga,
          );

          if (newChapters.length) {
            chapters.push(...newChapters);
            manga.chapters.push(...chapters);
            await manga.save();
          }

          const {
            author,
            status,
            synopsis,
          } = mangaScraper.extractAdditionalMangaDetailsFromChapter();

          await this.mangaModel.updateOne(
            { _id: manga._id },
            {
              $set: {
                last_sync: new Date(),
                author,
                synopsis,
                status,
              },
            },
          );
        }
      }
    }

    return {
      manga,
      chapters,
    };
  }

  async searchManga(searchQuery: SearchDTO): Promise<any> {
    const { query } = searchQuery;
    const hasBeenSearched = await this.searchModel.findOne({
      query: query,
    });

    let mangas: Array<Manga> = [];
    if (hasBeenSearched) {
      mangas = await this.mangaModel
        .find({
          title: {
            $regex: query,
          },
        })
        .exec();
    } else {
      const mangaScraper = new MangaScraper();
      const url = mangaScraper.getSearchUrl(query);
      await mangaScraper.loadUrl(url);
      mangas.push(...mangaScraper.extractMangaDetailsFromSearchUrl());
      await new this.searchModel(searchQuery).save();

      // No need to wait for inserting of mangas
      this.mangaModel.insertMany(mangas, {
        ordered: false,
      });
    }

    return mangas;
  }
}
