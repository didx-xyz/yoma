import Image from "next/image";
import Link from "next/link";
import imageThumbnailWoman from "public/images/home/thumbnail-woman.png";
import { NewsArticle } from "~/api/models/newsfeed";

interface NewsArticleCardProps {
  data: NewsArticle;
  className?: string;
}

export const NewsArticleCard: React.FC<NewsArticleCardProps> = ({
  data,
  className = "min-h-[340px] h-[300px] w-[340px] md:w-[380px]",
}) => {
  // Strip HTML tags and sanitize description
  const cleanDescription = data.description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframe tags
    .replace(/(?:javascript:|data:|vbscript:)/gi, "") // Remove dangerous URL schemes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove inline event handlers
    .replace(/<[^>]*>/g, "") // Remove all remaining HTML tags
    .trim();

  return (
    <div
      className={`flex h-full w-full flex-shrink-0 flex-col rounded-xl bg-white p-6 shadow-lg md:py-8 ${className}`}
    >
      <div className="mb-4 flex flex-row gap-6">
        <Image
          src={data.thumbnailURL || imageThumbnailWoman}
          alt={data.title || "News article"}
          className="h-[90px] w-[90px] flex-shrink-0 rounded-full object-cover"
          width={90}
          height={90}
          sizes="100vw"
        />

        <Link
          href={data.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-green font-nunito line-clamp-4 flex-1 text-[18px] font-bold transition-colors"
        >
          {data.title}
        </Link>
      </div>
      <p className="text-gray-dark mb-2 line-clamp-7 text-sm">
        {cleanDescription}
      </p>
      <Link
        href={data.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green text-sm font-bold hover:underline"
      >
        Read more...
      </Link>
    </div>
  );
};
