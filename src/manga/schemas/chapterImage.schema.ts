import * as mongoose from 'mongoose';

export const ChapterImage = new mongoose.Schema({
  chapterId: String,
  url: String,
  sequence: Number,
});
