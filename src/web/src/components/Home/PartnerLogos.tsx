import Image from "next/image";
import partnerGenU from "public/images/partners/01_gen-u-logo.png";
import partnerUnicef from "public/images/partners/02_unicef-logo.png";
import partnerAtingi from "public/images/partners/03_atingi-logo.png";
import partnerLeap from "public/images/partners/04_leap-logo.png";
import partnerHot from "public/images/partners/05_hot-logo.png";
import partnerCodingNetwork from "public/images/partners/06_codingnetwork-logo.png";
import partnerThinkCode from "public/images/partners/07_thinkcode-logo.png";
import partnerYoma from "public/images/partners/08_yoma-logo.png";
import partnerAtlas from "public/images/partners/09_atlas-logo.png";
import partnerGeoversity from "public/images/partners/10_geoversity-logo.png";
import partnerGoodwall from "public/images/partners/11_goodwall-logo.png";
import partnerSkills from "public/images/partners/12_skills-logo.png";
import partnerRlabs from "public/images/partners/13_rlabs-logo.png";
import partnerSilulo from "public/images/partners/14_silulo-logo.png";
import partnerDigify from "public/images/partners/15_digify-logo.png";
import partnerEdc from "public/images/partners/16_edc-logo.png";
import partnerMicrosoft from "public/images/partners/17_microsoft-logo.png";
import partnerYes from "public/images/partners/18_yes-logo.png";
import partnerWessa from "public/images/partners/19_wessa-logo.png";
import partnerAfricaUnion from "public/images/partners/20_africaunion-logo.png";
import { ScrollableContainer } from "~/components/Carousel";

interface PartnerLogosProps {
  headerText?: string;
  containerClassName?: string;
  scrollableContainerClassName?: string;
  headerClassName?: string;
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({
  headerText = "Our opportunity partners",
  containerClassName = "flex flex-col items-center justify-center",
  scrollableContainerClassName = "flex items-center gap-8 overflow-x-auto px-4 py-4 md:gap-12 lg:gap-20",
  headerClassName = "font-nunito mt-10 text-[26px] font-semibold tracking-normal", //"text-2xl font-semibold text-black",
}) => {
  return (
    <div className={containerClassName}>
      <h2 className={headerClassName}>{headerText}</h2>

      {/* PARTNER LOGOS */}
      <div className="w-screen">
        <ScrollableContainer className={scrollableContainerClassName}>
          <Image
            src={partnerGenU}
            alt="Generation Unlimited"
            width={143}
            height={52}
            className="pointer-events-none select-none"
            style={{ width: "143px", height: "52px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerUnicef}
            alt="UNICEF"
            width={99}
            height={60}
            className="pointer-events-none select-none"
            style={{ width: "99px", height: "60px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAtingi}
            alt="Atingi"
            width={72}
            height={72}
            className="pointer-events-none select-none"
            style={{ width: "72px", height: "72px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerLeap}
            alt="LEAP"
            width={91}
            height={91}
            className="pointer-events-none select-none"
            style={{ width: "91px", height: "91px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerHot}
            alt="HOT"
            width={102}
            height={61}
            className="pointer-events-none select-none"
            style={{ width: "102px", height: "61px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerCodingNetwork}
            alt="Coding Network"
            width={105}
            height={61}
            className="pointer-events-none select-none"
            style={{ width: "105px", height: "61px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerThinkCode}
            alt="Think Code"
            width={74}
            height={70}
            className="pointer-events-none select-none"
            style={{ width: "74px", height: "70px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerYoma}
            alt="Yoma"
            width={103}
            height={46}
            className="pointer-events-none select-none"
            style={{ width: "103px", height: "46px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAtlas}
            alt="Atlas"
            width={128}
            height={55}
            className="pointer-events-none select-none"
            style={{ width: "127px", height: "53px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerGeoversity}
            alt="Geoversity"
            width={200}
            height={41}
            className="pointer-events-none select-none"
            style={{ width: "200px", height: "41px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerGoodwall}
            alt="Goodwall"
            width={138}
            height={33}
            className="pointer-events-none select-none"
            style={{ width: "138px", height: "33px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerSkills}
            alt="Skills"
            width={113}
            height={56}
            className="pointer-events-none select-none"
            style={{ width: "113px", height: "56px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerRlabs}
            alt="RLabs"
            width={64}
            height={69}
            className="pointer-events-none select-none"
            style={{ width: "64px", height: "69px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerSilulo}
            alt="Silulo"
            width={110}
            height={38}
            className="pointer-events-none select-none"
            style={{ width: "110px", height: "38px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerDigify}
            alt="Digify"
            width={92}
            height={46}
            className="pointer-events-none select-none"
            style={{ width: "92px", height: "46px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerEdc}
            alt="EDC"
            width={148}
            height={22}
            className="pointer-events-none select-none"
            style={{ width: "148px", height: "22px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerMicrosoft}
            alt="Microsoft"
            width={156}
            height={33}
            className="pointer-events-none select-none"
            style={{ width: "156px", height: "33px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerYes}
            alt="YES"
            width={70}
            height={70}
            className="pointer-events-none select-none"
            style={{ width: "70px", height: "70px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerWessa}
            alt="WESSA"
            width={90}
            height={77}
            className="pointer-events-none select-none"
            style={{ width: "90px", height: "77px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAfricaUnion}
            alt="Africa Union"
            width={139}
            height={53}
            className="pointer-events-none select-none"
            style={{ width: "139px", height: "53px" }}
            draggable={false}
            quality={100}
            unoptimized={true}
          />
        </ScrollableContainer>
      </div>
    </div>
  );
};

export default PartnerLogos;
