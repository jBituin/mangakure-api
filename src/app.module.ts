import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AboutModule } from './about/about.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MangaModule } from './manga/manga.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/mangakure', {
      useNewUrlParser: true,
    }),
    MangaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
