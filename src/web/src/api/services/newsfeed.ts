import { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  NewsArticleSearchFilter,
  NewsArticleSearchResults,
} from "../models/newsfeed";

export const searchNewsArticles = async (
  filter: NewsArticleSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<NewsArticleSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<NewsArticleSearchResults>(
    `/newsfeed/article/search`,
    filter,
  );

  return data;
};
