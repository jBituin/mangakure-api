import * as mongoose from 'mongoose';

export const ChapterPageSchema = new mongoose.Schema({
  url: String,
  sequence: Number,
  alt: String,
});
