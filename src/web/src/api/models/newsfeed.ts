import { PaginationFilter } from "./common";

export interface NewsArticleSearchFilter extends PaginationFilter {
  feedType?: FeedType;
  startDate: string | null;
  endDate: string | null;
  valueContains: string | null;
}

export enum FeedType {
  News,
  Stories,
}

export interface NewsArticleSearchResults {
  totalCount: number | null;
  items: NewsArticle[];
}

export interface NewsArticle {
  id: string;
  feedType: string;
  externalId: string;
  title: string;
  description: string;
  url: string;
  thumbnailURL: string | null;
  publishedDate: string;
  dateCreated: string;
  dateModified: string;
}

export interface NewsFeed {
  type: FeedType | string;
  title: string;
  url: string;
}
