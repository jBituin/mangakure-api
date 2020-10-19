import { Module } from '@nestjs/common';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MangaSchema } from './schemas/manga.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Manga', schema: MangaSchema }]),
  ],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule {}
