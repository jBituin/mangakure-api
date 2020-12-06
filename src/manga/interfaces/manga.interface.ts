import { Document } from 'mongoose';
import { Chapter } from './chapter.interface';

export interface Manga extends Document {
  readonly title: string;
  readonly coverImageUrl: string;
  readonly url: string;
  readonly created_at: Date;
  readonly synopsis: string;
  readonly author: string;
  readonly tags: string[];
  readonly slug: string;
  readonly status: string;
  readonly last_sync: Date;
  readonly chapters: Chapter[];
}
