import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery } from 'mongoose';
import { Manga } from './interfaces/manga.interface';
import { CreateMangaDTO } from './dto/manga.dto';

import { Chapter } from './interfaces/chapter.interface';
import { CreateChapterDTO } from './dto/chapter.dto';

import { ChapterImage } from './interfaces/chapterImage.interface';
import { ChapterImageDTO } from './dto/chapterImage.dto';

import NeloScraper from '../crawler/crawler';
@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
    @InjectModel('Chapter') private readonly chapterModel: Model<Chapter>,
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
    // 24 mangas per page
    let mangas = [];
    for (let index = 1; index <= 1; index++) {
      const url = neloScraper.getPaginatedTopViewUrl(index);
      await neloScraper.loadUrl(url);

      mangas.push(...neloScraper.extractMangaDetailsFromTopViewUrl());
      console.log('mangaszz', mangas);
    }

    const newMangas = this.mangaModel.insertMany(mangas);
    return newMangas;
  }

  async loadChapters(): Promise<any> {
    const neloScraper = new NeloScraper();
    const mangas = await this.getAllManga();

    let chapters = [];
    try {
      for (let index = 0; index < mangas.length; index++) {
        await neloScraper.loadUrl(mangas[index].url);
        chapters.push(
          ...neloScraper.extractChaptersFromManga(mangas[index]._id),
        );

        console.log('chapters', chapters);
      }
      const newChapters = this.chapterModel.insertMany(chapters);
      return newChapters;
    } catch (e) {}
  }

  async getChapterImages(chapterId): Promise<any> {}
}
