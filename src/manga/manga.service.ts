import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseFilterQuery } from 'mongoose';
import { Manga } from './interfaces/manga.interface';
import { CreateMangaDTO } from './dto/manga.dto';

@Injectable()
export class MangaService {
  constructor(
    @InjectModel('Manga') private readonly mangaModel: Model<Manga>,
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
}
