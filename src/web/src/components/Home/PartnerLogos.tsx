import Image from "next/image";
import partnerAccenture from "public/images/partners/accenture.png";
import partnerADA from "public/images/partners/ada.png";
import partnerAfricaUnion from "public/images/partners/africaunion.png";
import partnerAtingi from "public/images/partners/atingi.png";
import partnerAtlas from "public/images/partners/atlas.png";
import partnerBotnar from "public/images/partners/botnar.png";
import partnerCanada from "public/images/partners/canada.png";
import partnerCapGenimi from "public/images/partners/capgemini.png";
import partnerCodingNetwork from "public/images/partners/codingnetwork.png";
import partnerDidx from "public/images/partners/didx.png";
import partnerDigify from "public/images/partners/digify.png";
import partnerEdc from "public/images/partners/edc.png";
import partnerGenU from "public/images/partners/gen-u.png";
import partnerGeoversity from "public/images/partners/geoversity.png";
import partnerGiz from "public/images/partners/giz.png";
import partnerGoodwall from "public/images/partners/goodwall.png";
import partnerHot from "public/images/partners/hot.png";
import partnerIXO from "public/images/partners/ixo.png";
import partnerLeap from "public/images/partners/leap.png";
import partnerMicrosoft from "public/images/partners/microsoft.png";
import partnerRlabs from "public/images/partners/rlabs.png";
import partnerSAP from "public/images/partners/sap.png";
import partnerSilulo from "public/images/partners/silulo.png";
import partnerSkills from "public/images/partners/skills.png";
import partnerThinkCode from "public/images/partners/thinkcode.png";
import partnerUmuzi from "public/images/partners/umuzi.png";
import partnerUnicef from "public/images/partners/unicef.png";
import partnerWessa from "public/images/partners/wessa.png";
import partnerYes from "public/images/partners/yes.png";
import partnerYoma from "public/images/partners/yoma.png";
import { ScrollableContainer } from "~/components/Carousel";

export enum PartnerLogoOptions {
  GEN_UNLIMITED = "gen-u",
  UNICEF = "unicef",
  DIDX = "didx",
  GIZ = "giz",
  BOTNAR = "botnar",
  UMUZI = "umuzi",
  ACCENTURE = "accenture",
  SAP = "sap",
  IXO = "ixo",
  CAP_GEMINI = "cap-gemini",
  CANADA = "canada",
  ATINGI = "atingi",
  LEAP = "leap",
  HOT = "hot",
  CODING_NETWORK = "coding-network",
  THINK_CODE = "think-code",
  YOMA = "yoma",
  ATLAS = "atlas",
  GEOVERSITY = "geoversity",
  GOODWALL = "goodwall",
  SKILLS = "skills",
  RLABS = "rlabs",
  SILULO = "silulo",
  DIGIFY = "digify",
  EDC = "edc",
  MICROSOFT = "microsoft",
  YES = "yes",
  WESSA = "wessa",
  AFRICA_UNION = "africa-union",
  ADA = "ada",
}

interface PartnerLogosProps {
  headerText?: string;
  containerClassName?: string;
  scrollableContainerClassName?: string;
  headerClassName?: string;
  options: PartnerLogoOptions[];
}

const PartnerLogos: React.FC<PartnerLogosProps> = ({
  headerText = "Our opportunity partners",
  containerClassName = "flex flex-col items-center justify-center",
  scrollableContainerClassName = "flex items-center gap-8 overflow-x-auto px-4 py-4 md:gap-12 lg:gap-20",
  headerClassName = "font-nunito mt-10 text-[26px] font-semibold tracking-normal",
  options,
}) => {
  const logoMap: Record<
    PartnerLogoOptions,
    { src: any; alt: string; width: number; height: number }
  > = {
    [PartnerLogoOptions.GEN_UNLIMITED]: {
      src: partnerGenU,
      alt: "Generation Unlimited",
      width: 143,
      height: 52,
    },
    [PartnerLogoOptions.UNICEF]: {
      src: partnerUnicef,
      alt: "UNICEF",
      width: 99,
      height: 60,
    },
    [PartnerLogoOptions.DIDX]: {
      src: partnerDidx,
      alt: "DIDX",
      width: 70,
      height: 35,
    },
    [PartnerLogoOptions.GIZ]: {
      src: partnerGiz,
      alt: "GIZ",
      width: 47,
      height: 35,
    },
    [PartnerLogoOptions.BOTNAR]: {
      src: partnerBotnar,
      alt: "Botnar",
      width: 95,
      height: 35,
    },
    [PartnerLogoOptions.UMUZI]: {
      src: partnerUmuzi,
      alt: "Umuzi",
      width: 67,
      height: 60,
    },
    [PartnerLogoOptions.ACCENTURE]: {
      src: partnerAccenture,
      alt: "Accenture",
      width: 136,
      height: 50,
    },
    [PartnerLogoOptions.SAP]: {
      src: partnerSAP,
      alt: "SAP",
      width: 68,
      height: 35,
    },
    [PartnerLogoOptions.IXO]: {
      src: partnerIXO,
      alt: "IXO",
      width: 62,
      height: 37,
    },
    [PartnerLogoOptions.CAP_GEMINI]: {
      src: partnerCapGenimi,
      alt: "Capgemini",
      width: 138,
      height: 32,
    },
    [PartnerLogoOptions.CANADA]: {
      src: partnerCanada,
      alt: "Canada",
      width: 184,
      height: 37,
    },
    [PartnerLogoOptions.ATINGI]: {
      src: partnerAtingi,
      alt: "Atingi",
      width: 72,
      height: 72,
    },
    [PartnerLogoOptions.LEAP]: {
      src: partnerLeap,
      alt: "LEAP",
      width: 91,
      height: 91,
    },
    [PartnerLogoOptions.HOT]: {
      src: partnerHot,
      alt: "HOT",
      width: 102,
      height: 61,
    },
    [PartnerLogoOptions.CODING_NETWORK]: {
      src: partnerCodingNetwork,
      alt: "Coding Network",
      width: 105,
      height: 61,
    },
    [PartnerLogoOptions.THINK_CODE]: {
      src: partnerThinkCode,
      alt: "Think Code",
      width: 74,
      height: 70,
    },
    [PartnerLogoOptions.YOMA]: {
      src: partnerYoma,
      alt: "Yoma",
      width: 103,
      height: 46,
    },
    [PartnerLogoOptions.ATLAS]: {
      src: partnerAtlas,
      alt: "Atlas",
      width: 128,
      height: 55,
    },
    [PartnerLogoOptions.GEOVERSITY]: {
      src: partnerGeoversity,
      alt: "Geoversity",
      width: 200,
      height: 41,
    },
    [PartnerLogoOptions.GOODWALL]: {
      src: partnerGoodwall,
      alt: "Goodwall",
      width: 138,
      height: 33,
    },
    [PartnerLogoOptions.SKILLS]: {
      src: partnerSkills,
      alt: "Skills",
      width: 113,
      height: 56,
    },
    [PartnerLogoOptions.RLABS]: {
      src: partnerRlabs,
      alt: "RLabs",
      width: 64,
      height: 69,
    },
    [PartnerLogoOptions.SILULO]: {
      src: partnerSilulo,
      alt: "Silulo",
      width: 110,
      height: 38,
    },
    [PartnerLogoOptions.DIGIFY]: {
      src: partnerDigify,
      alt: "Digify",
      width: 92,
      height: 46,
    },
    [PartnerLogoOptions.EDC]: {
      src: partnerEdc,
      alt: "EDC",
      width: 148,
      height: 22,
    },
    [PartnerLogoOptions.MICROSOFT]: {
      src: partnerMicrosoft,
      alt: "Microsoft",
      width: 156,
      height: 33,
    },
    [PartnerLogoOptions.YES]: {
      src: partnerYes,
      alt: "YES",
      width: 70,
      height: 70,
    },
    [PartnerLogoOptions.WESSA]: {
      src: partnerWessa,
      alt: "WESSA",
      width: 90,
      height: 77,
    },
    [PartnerLogoOptions.AFRICA_UNION]: {
      src: partnerAfricaUnion,
      alt: "Africa Union",
      width: 139,
      height: 53,
    },
    [PartnerLogoOptions.ADA]: {
      src: partnerADA,
      alt: "ADA",
      width: 92,
      height: 40,
    },
  };

  return (
    <div className={containerClassName}>
      <h2 className={headerClassName}>{headerText}</h2>

      {/* PARTNER LOGOS */}
      <div className="w-screen">
        <ScrollableContainer className={scrollableContainerClassName}>
          {options.map((option) => {
            const logo = logoMap[option];
            if (!logo) return null;

            return (
              <Image
                key={option}
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="pointer-events-none select-none"
                style={{ width: `${logo.width}px`, height: `${logo.height}px` }}
                draggable={false}
                quality={100}
                unoptimized={true}
              />
            );
          })}
        </ScrollableContainer>
      </div>
    </div>
  );
};

export default PartnerLogos;
