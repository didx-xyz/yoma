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
  containerClassName = "mt-16 flex flex-col items-center justify-center gap-4",
  scrollableContainerClassName = "flex gap-8 overflow-x-auto px-4 py-4 md:gap-12 lg:gap-20",
  headerClassName = "text-2xl font-semibold text-black",
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
            width={75}
            height={75}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerUnicef}
            alt="UNICEF"
            width={101}
            height={57}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAtingi}
            alt="Atingi"
            width={73}
            height={73}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerLeap}
            alt="LEAP"
            width={92}
            height={92}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerHot}
            alt="HOT"
            width={104}
            height={63}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerCodingNetwork}
            alt="Coding Network"
            width={105}
            height={61}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerThinkCode}
            alt="Think Code"
            width={75}
            height={71}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerYoma}
            alt="Yoma"
            width={104}
            height={47}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAtlas}
            alt="Atlas"
            width={128}
            height={55}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerGeoversity}
            alt="Geoversity"
            width={201}
            height={75}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerGoodwall}
            alt="Goodwall"
            width={140}
            height={27}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerSkills}
            alt="Skills"
            width={114}
            height={57}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerRlabs}
            alt="RLabs"
            width={85}
            height={49}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerSilulo}
            alt="Silulo"
            width={110}
            height={39}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerDigify}
            alt="Digify"
            width={93}
            height={47}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerEdc}
            alt="EDC"
            width={149}
            height={23}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerMicrosoft}
            alt="Microsoft"
            width={158}
            height={35}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerYes}
            alt="YES"
            width={70}
            height={71}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerWessa}
            alt="WESSA"
            width={92}
            height={77}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
            draggable={false}
            quality={100}
            unoptimized={true}
          />
          <Image
            src={partnerAfricaUnion}
            alt="Africa Union"
            width={140}
            height={53}
            className="pointer-events-none flex-shrink-0 object-contain select-none"
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
