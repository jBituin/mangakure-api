export interface PaginationResultInterface<PaginationEntity> {
  results: PaginationEntity[];
  total: number;
  page: number;
  pageSize: number;
  next?: string;
  previous?: string;
}
