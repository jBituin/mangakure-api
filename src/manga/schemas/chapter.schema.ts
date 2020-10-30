import * as mongoose from 'mongoose';

export const ChapterSchema = new mongoose.Schema({
  mangaId: String,
  label: String,
  url: String,
  sequence: Number,
  slug: String,
  mangaSlug: String,
});
