import { Document } from 'mongoose';

export interface ChapterImage extends Document {
  readonly chapterId: string;
  readonly url: string;
  readonly sequence: number;
}
