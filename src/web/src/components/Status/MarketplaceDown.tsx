import Head from "next/head";
import productsImage from "public/images/products.png";
import Image from "next/image";

export const MarketplaceDown: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Marketplace Unavailable</title>
      </Head>

      <div className="container flex max-w-7xl flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-8 rounded-lg bg-white p-4 py-16 shadow-custom">
          <Image src={productsImage} height={100} width={100} alt="Products" />
          <h2 className="text-center text-2xl font-medium text-gray-dark">
            Updating the store, come back soon!
          </h2>
          <p className="text-center text-gray-dark">
            Please try again later :(
          </p>
        </div>
      </div>
    </>
  );
};
