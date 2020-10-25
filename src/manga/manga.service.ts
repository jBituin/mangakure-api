import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery, Types } from 'mongoose';
import { Manga } from './interfaces/manga.interface';
import { CreateMangaDTO } from './dto/manga.dto';

import { Chapter } from './interfaces/chapter.interface';

import { ChapterPage } from './interfaces/chapterPage.interface';

import MangaScraper from '../crawler/crawler';
@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
    @InjectModel('Chapter') private readonly chapterModel: Model<Chapter>,
    @InjectModel('ChapterPage')
    private readonly chapterPageModel: Model<ChapterPage>,
  ) {}

  async getAllManga(): Promise<Manga[]> {
    const mangas = await this.mangaModel.find().exec();
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
          mangaScraper.extractChaptersFromManga(mangas[index].id),
        );
        chapters.push(...c);
      }
      return chapters;
    } catch (e) {}
  }

  async getChapterPages(chapterId: string): Promise<any> {
    let chapterPages = await this.chapterPageModel.find({
      chapterId,
    });

    if (!chapterPages.length) {
      const mangaScraper = new MangaScraper();
      const chapter = await this.chapterModel.findOne({
        _id: Types.ObjectId(chapterId),
      });
      await mangaScraper.loadUrl(chapter.url);

      chapterPages = mangaScraper.extractPagesFromChapter(chapterId);

      this.chapterPageModel.insertMany(chapterPages);
    }

    return chapterPages;
  }

  async getMangaChapters(mangaId): Promise<any> {
    const manga = await this.mangaModel.findOne({
      _id: Types.ObjectId(mangaId),
    });

    let chapters = await this.chapterModel.find({
      mangaId,
    });

    if (!manga) throw new Error('Manga not found');

    if (!chapters.length) {
      const mangaScraper = new MangaScraper();
      await mangaScraper.loadUrl(manga.url);

      chapters = mangaScraper.extractChaptersFromManga(mangaId);

      this.chapterModel.insertMany(chapters);
    }

    return {
      manga,
      chapters,
    };
  }
}
