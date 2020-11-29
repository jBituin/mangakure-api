import { PaginationResultInterface } from './pagination.results.interface';

export class Pagination<PaginationEntity> {
  public results: PaginationEntity[];
  public pageTotal: number;
  public total: number;
  public page: number;
  public pageSize: number;

  constructor(paginationResults: PaginationResultInterface<PaginationEntity>) {
    this.results = paginationResults.results;
    this.pageTotal = paginationResults.results.length;
    this.total = paginationResults.total;
    this.page = paginationResults.page;
    this.pageSize = paginationResults.pageSize;
  }
}
