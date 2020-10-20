import { Document } from 'mongoose';

export interface Chapter extends Document {
  readonly mangaId: string;
  readonly label: string;
  readonly url: string;
  readonly sequence: number;
}
