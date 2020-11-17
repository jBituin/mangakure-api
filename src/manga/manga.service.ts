import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery, Types } from 'mongoose';

import { CreateMangaDTO } from './dto/manga.dto';

import { Manga } from './interfaces/manga.interface';
import { Chapter } from './interfaces/chapter.interface';
import { ChapterPage } from './interfaces/chapterPage.interface';

import { Search } from './interfaces/search.interface';

import MangaScraper from '../crawler/crawler';
import { SearchDTO } from './dto/search.dto';
@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
    @InjectModel('Chapter') private readonly chapterModel: Model<Chapter>,
    @InjectModel('ChapterPage')
    private readonly chapterPageModel: Model<ChapterPage>,
    @InjectModel('Search') private readonly searchModel: Model<Search>,
  ) {}

  async getAllManga(): Promise<Manga[]> {
    const mangas = await this.mangaModel
      .aggregate([
        {
          $lookup: {
            from: 'chapters',
            let: { mangaSlug: '$slug', sequence: '$sequence' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$mangaSlug', '$$mangaSlug'] }],
                  },
                },
              },
              {
                $sort: {
                  sequence: -1,
                },
              },
              {
                $limit: 1,
              },
            ],
            as: 'latestChapters',
          },
        },
      ])
      .exec();
    return mangas;
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

  async loadMangas(): Promise<any> {
    try {
      const mangaScraper = new MangaScraper();

      // Insert 5 pages worth of mangas
      // 30 mangas per iteration
      const mangas = [];
      for (let index = 1; index <= 5; index++) {
        const url = mangaScraper.getPaginatedTopViewUrl(index.toString());
        await mangaScraper.loadUrl(url);
        mangas.push(...mangaScraper.extractMangaDetailsFromTopViewUrl());
      }

      const newMangas = await this.mangaModel.insertMany(mangas, {
        ordered: false,
      });

      for (let index = 1; index < newMangas.length; index++) {
        await mangaScraper.loadUrl(newMangas[index].url);
        const chapters = mangaScraper.extractChaptersFromManga(
          newMangas[index]._id,
          newMangas[index].slug,
        );

        const additionalMangaDetails = mangaScraper.extractAdditionalMangaDetailsFromChapter();

        const newMangaDetails = {
          ...newMangas[index],
          ...additionalMangaDetails,
        };
        await this.mangaModel.findByIdAndUpdate(
          Types.ObjectId(newMangas[index]._id),
          newMangaDetails,
        );
        await this.chapterModel.insertMany(chapters);
      }

      return newMangas;
    } catch (error) {
      Logger.log(error);
    }
  }

  async loadChapters(): Promise<any> {
    const mangaScraper = new MangaScraper();
    const mangas = await this.getAllManga();

    let chapters = [];
    try {
      for (let index = 0; index < mangas.length; index++) {
        await mangaScraper.loadUrl(mangas[index].url);

        const c = await this.chapterModel.insertMany(
          mangaScraper.extractChaptersFromManga(
            mangas[index].id,
            mangas[index].slug,
          ),
        );
        chapters.push(...c);
      }
      return chapters;
    } catch (e) {}
  }

  async getChapterPages(mangaSlug: string, chapterSlug: string): Promise<any> {
    let chapterPages = await this.chapterPageModel.find({
      mangaSlug,
      chapterSlug,
    });

    if (!chapterPages.length) {
      const mangaScraper = new MangaScraper();
      const chapter = await this.chapterModel.findOne({
        mangaSlug,
        slug: chapterSlug,
      });
      console.log('chapter', chapter);
      await mangaScraper.loadUrl(chapter.url);
      chapterPages = mangaScraper.extractPagesFromChapter(
        mangaSlug,
        chapterSlug,
      );

      this.chapterPageModel.insertMany(chapterPages);
    }

    return chapterPages;
  }

  async getMangaChapters(mangaSlug): Promise<any> {
    const manga = await this.mangaModel.findOne({
      slug: mangaSlug,
    });

    if (!manga) throw new Error('Manga not found');

    const mangaId = manga._id;
    let chapters = await this.chapterModel.find({
      mangaId,
    });

    if (!chapters.length) {
      const mangaScraper = new MangaScraper();
      await mangaScraper.loadUrl(manga.url);

      chapters = mangaScraper.extractChaptersFromManga(mangaId, mangaSlug);

      this.chapterModel.insertMany(chapters);
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
