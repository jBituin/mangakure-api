import * as mongoose from 'mongoose';

export const ChapterPageSchema = new mongoose.Schema({
  chapterId: String,
  url: String,
  sequence: Number,
  alt: String,
});
