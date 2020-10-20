import { Document } from 'mongoose';

export interface Manga extends Document {
  readonly title: string;
  readonly cover_image_url: string;
  readonly url: string;
  readonly created_at: Date;
}
