import * as mongoose from 'mongoose';
import { ChapterPageSchema } from './chapterPage.schema';

export const ChapterSchema = new mongoose.Schema({
  label: String,
  url: String,
  sequence: Number,
  slug: String,
  pages: [ChapterPageSchema],
});
