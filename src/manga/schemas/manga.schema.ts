import * as mongoose from 'mongoose';

export const MangaSchema = new mongoose.Schema({
  title: String,
  coverImageUrl: String,
  url: String,
  created_at: { type: Date, default: Date.now },
  synopsis: String,
  author: String,
  tags: [String],
  slug: {
    type: String,
    unique: true,
  },
});
