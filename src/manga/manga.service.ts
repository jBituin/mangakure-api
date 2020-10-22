import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery, Types } from 'mongoose';
import { Manga } from './interfaces/manga.interface';
import { CreateMangaDTO } from './dto/manga.dto';

import { Chapter } from './interfaces/chapter.interface';

import { ChapterImage } from './interfaces/chapterImage.interface';

import NeloScraper from '../crawler/crawler';
@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
    @InjectModel('Chapter') private readonly chapterModel: Model<Chapter>,
    @InjectModel('ChapterImage')
    private readonly chapterImageModel: Model<ChapterImage>,
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
    const neloScraper = new NeloScraper();

    // Insert 5 pages worth of mangas
    // 24 mangas per iteration
    const mangas = [];
    for (let index = 1; index <= 5; index++) {
      const url = neloScraper.getPaginatedTopViewUrl(index);
      await neloScraper.loadUrl(url);
      mangas.push(...neloScraper.extractMangaDetailsFromTopViewUrl());
    }

    const newMangas = await this.mangaModel.insertMany(mangas, {
      ordered: false,
    });

    for (let index = 1; index < newMangas.length; index++) {
      await neloScraper.loadUrl(newMangas[index].url);
      const chapters = neloScraper.extractChaptersFromManga(
        newMangas[index]._id,
      );
      await this.chapterModel.insertMany(chapters);
    }

    return newMangas;
  }

  async loadChapters(): Promise<any> {
    const neloScraper = new NeloScraper();
    const mangas = await this.getAllManga();

    let chapters = [];
    try {
      for (let index = 0; index < mangas.length; index++) {
        await neloScraper.loadUrl(mangas[index].url);

        const c = await this.chapterModel.insertMany(
          neloScraper.extractChaptersFromManga(mangas[index].id),
        );
        chapters.push(...c);
      }
      return chapters;
    } catch (e) {}
  }

  async getChapterImages(chapterId: string): Promise<any> {
    let chapterImages = await this.chapterImageModel.find({
      chapterId,
    });

    if (!chapterImages.length) {
      const neloScraper = new NeloScraper();
      const chapter = await this.chapterModel.findOne({
        _id: Types.ObjectId(chapterId),
      });
      await neloScraper.loadUrl(chapter.url);

      chapterImages = neloScraper.extractImagesFromChapter(chapterId);

      this.chapterImageModel.insertMany(chapterImages);
    }
    return chapterImages;
  }

  async getMangaChapters(mangaId): Promise<any> {
    let mangaChapters = await this.chapterModel.find({
      mangaId,
    });

    return mangaChapters;
  }
}
