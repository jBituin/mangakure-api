import * as mongoose from 'mongoose';

export const ChapterImageSchema = new mongoose.Schema({
  chapterId: String,
  url: String,
  sequence: Number,
});
