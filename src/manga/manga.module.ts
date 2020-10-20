import { Module } from '@nestjs/common';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MangaSchema } from './schemas/manga.schema';
import { ChapterSchema } from './schemas/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Manga', schema: MangaSchema },
      { name: 'Chapter', schema: ChapterSchema },
    ]),
  ],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule {}
