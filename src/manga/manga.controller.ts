import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Post,
  Body,
  Put,
  Query,
  NotFoundException,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { MangaService } from './manga.service';
import { CreateMangaDTO } from './dto/manga.dto';

@Controller('manga')
export class MangaController {
  constructor(private mangaService: MangaService) {}

  @Post('/manga')
  async addManga(@Res() res, @Body() createMangaDTO: CreateMangaDTO) {
    const manga = await this.mangaService.addManga(createMangaDTO);
    return res.status(HttpStatus.OK).json({
      message: 'Manga has been added successfully',
      manga,
    });
  }

  @Get('/mangas')
  async getAllManga(@Res() res) {
    const mangas = await this.mangaService.getAllManga();
    return res.status(HttpStatus.OK).json(mangas);
  }

  @Get('customer/:mangaId')
  async getManga(@Res() res, @Param('mangaId') mangaId) {
    const manga = await this.mangaService.getManga(mangaId);
    if (!manga) throw new NotFoundException('Manga does not exist!');
    return res.status(HttpStatus.OK).json(manga);
  }

  @Put('/update')
  async updateManga(
    @Res() res,
    @Query() mangaId,
    @Body() createMangaDTO: CreateMangaDTO,
  ) {
    const manga = await this.mangaService.updateManga(mangaId, createMangaDTO);
    if (!manga) throw new NotFoundException('Manga does not exist!');
    return res.status(HttpStatus.OK).json({
      message: 'Manga has been successfully updated',
      manga,
    });
  }

  @Delete('/delete')
  async deleteManga(@Res() res, @Query('mangaId') mangaId) {
    const manga = await this.mangaService.deleteManga(mangaId);
    if (!manga) throw new NotFoundException('Manga does not exist!');
    return res.status(HttpStatus.OK).json({
      message: 'Manga has been deleted',
      manga,
    });
  }

  @Post('/load-mangas')
  async loadMangas(@Res() res) {
    const newMangas = await this.mangaService.loadMangas();

    return res.status(HttpStatus.OK).json({
      message: 'New batch of manga has been added',
      newMangas,
    });
  }

  @Get('/load-chapters')
  async loadChapters(@Res() res) {
    const loadedChapters = await this.mangaService.loadChapters();

    return res.status(HttpStatus.OK).json({
      message: 'New chapters has bee loaded',
      loadedChapters,
    });
  }

  @Get('/chapter-images/:chapterId')
  async getChapterImages(@Res() res, @Param('chapterId') chapterId) {
    const chapterImages = await this.mangaService.getChapterImages(chapterId);
  }
}
