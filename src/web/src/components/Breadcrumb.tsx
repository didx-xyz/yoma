import React from "react";
import Image from "next/image";
import type { TabItem } from "~/api/models/common";
import Link from "next/link";
import { toBase64, shimmer } from "~/lib/image";

interface InputProps {
  items: TabItem[];
}

const Breadcrumb: React.FC<InputProps> = ({ items }) => {
  return (
    <div className="breadcrumbs text-sm text-gray-dark">
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.url ? (
              <Link
                className="max-w-[200px] overflow-hidden text-ellipsis font-bold hover:text-gray"
                href={item.url}
              >
                {item.iconImage && (
                  <Image
                    src={item.iconImage}
                    alt={`${item.title} icon`}
                    width={20}
                    height={20}
                    sizes="(max-width: 20px) 30vw, 50vw"
                    priority={true}
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(
                      shimmer(20, 20),
                    )}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "20px",
                      maxHeight: "20px",
                    }}
                  />
                )}
                {item.iconElement && <>{item.iconElement}</>}
                {item.title}
              </Link>
            ) : (
              <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                {item.title}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Breadcrumb;
