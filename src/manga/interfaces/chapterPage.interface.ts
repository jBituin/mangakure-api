import { Document } from 'mongoose';

export interface ChapterPage extends Document {
  readonly chapterId: string;
  readonly url: string;
  readonly sequence: number;
  readonly alt: string;
}
