import Image from "next/image";
import Link from "next/link";
import imageThumbnailWoman from "public/images/home/thumbnail-woman.png";
import { NewsArticle } from "~/api/models/newsfeed";

interface NewsArticleCardProps {
  data: NewsArticle;
}

export const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ data }) => {
  // Strip HTML tags from description
  const cleanDescription = data.description.replace(/<[^>]*>/g, "");

  return (
    <div className="flex h-[300px] w-[340px] flex-shrink-0 flex-col gap-4 rounded-xl bg-white p-6 shadow-lg md:w-[380px] md:py-8">
      <div className="flex flex-row gap-6">
        <Image
          src={data.thumbnailURL || imageThumbnailWoman}
          alt={data.title || "News article"}
          className="object-coverx max-h-[90px] w-full max-w-[90px] rounded-full"
          width={90}
          height={90}
          sizes="100vw"
        />

        <Link
          href={data.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-green line-clamp-3 text-[18px] font-bold transition-colors"
        >
          {data.title}
        </Link>
      </div>
      <p className="text-gray-dark line-clamp-6 text-sm">{cleanDescription}</p>
      <Link
        href={data.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green font-semiboldx text-sm font-bold hover:underline"
      >
        Read more...
      </Link>
    </div>
  );
};
