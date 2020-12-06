import { ChapterPage } from '../interfaces/chapterPage.interface';

export class CreateChapterDTO {
  readonly mangaId: string;
  readonly label: string;
  readonly url: string;
  readonly sequence: number;
  readonly slug: string;
  readonly mangaSlug: string;
  readonly pages: ChapterPage[];
}
