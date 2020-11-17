import { Document } from 'mongoose';

export interface Search extends Document {
  readonly query: string;
}
