import { Document } from 'mongoose';

export interface ChapterPage extends Document {
  readonly mangaId: string;
  readonly url: string;
  readonly sequence: number;
  readonly alt: string;
  readonly chapterSlug: string;
}
