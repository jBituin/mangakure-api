import * as mongoose from 'mongoose';

export const MangaSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
  },
  cover_image_url: String,
  url: String,
  created_at: { type: Date, default: Date.now },
});
