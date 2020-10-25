export class CreateMangaDTO {
  readonly title: string;
  readonly cover_image_url: string;
  readonly url: string;
  readonly created_at: Date;
  readonly synopsis: string;
  readonly author: string;
  readonly tags: string[];
}
