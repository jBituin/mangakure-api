import { Document } from 'mongoose';
import { ChapterPage } from './chapterPage.interface';

export interface Chapter extends Document {
  readonly mangaId: string;
  readonly label: string;
  readonly url: string;
  readonly sequence: number;
  readonly slug: string;
  readonly mangaSlug: string;
  readonly pages: ChapterPage[];
}
