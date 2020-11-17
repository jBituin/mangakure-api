import * as mongoose from 'mongoose';

export const SearchSchema = new mongoose.Schema({
  query: String,
});
