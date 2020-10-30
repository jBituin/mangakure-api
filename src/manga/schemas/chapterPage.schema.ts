import * as mongoose from 'mongoose';

export const ChapterPageSchema = new mongoose.Schema({
  mangaId: String,
  url: String,
  sequence: Number,
  alt: String,
  chapterSlug: String,
});
