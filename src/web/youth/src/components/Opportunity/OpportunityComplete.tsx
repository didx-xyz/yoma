import { OpportunityPublicSmallComponent } from "./OpportunityPublicSmall";
import type {
  OpportunityInfo,
  OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import Link from "next/link";
import Image from "next/image";
import iconOpen from "public/images/icon-open.svg";
import iconSuccess from "public/images/icon-success.svg";
import iconBell from "public/images/icon-bell.svg";
import iconCertificate from "public/images/icon-certificate.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconVideo from "public/images/icon-video.svg";
import iconBookmark from "public/images/icon-bookmark.svg";
import { IoMdClose } from "react-icons/io";
import { FileUpload } from "./FileUpload";
import { ACCEPTED_DOC_TYPES, ACCEPTED_DOC_TYPES_LABEL } from "~/lib/constants";
import {
  performActionSendForVerificationManual,
  saveMyOpportunity,
} from "~/api/services/myOpportunities";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { MyOpportunityRequestVerify } from "~/api/models/myOpportunity";

interface InputProps {
  [id: string]: any;
  opportunityInfo: OpportunityInfo | undefined;
  // title: string;
  // data: OpportunitySearchResultsInfo;
  // viewAllUrl?: string;
  onClose?: () => void;
  onSave?: () => void;
}

export const OpportunityComplete: React.FC<InputProps> = ({
  id,
  opportunityInfo,
  // title,
  // data,
  // viewAllUrl,
  onClose,
  onSave,
}) => {
  // 🧮 analytics
  // useEffect(() => {
  //   ga.view_item_list({
  //     item_list_id: id,
  //     item_list_name: title,
  //     items: opportunities.items.map((item) => ({
  //       item_id: item.id,
  //       item_name: item.name,
  //       item_category: "Opportunity",
  //       price: item.priceInUSD,
  //       quantity: 1,
  //     })),
  //   });
  // }, [id, title, opportunities]);

  // 🔔 click handler:
  // const handleClick = useCallback(
  //   (item: OpportunityInfo) => {
  //     // ga.select_item({
  //     //   item_list_id: id,
  //     //   item_list_name: title,
  //     //   items: [
  //     //     {
  //     //       item_id: item.id,
  //     //       item_name: item.name,
  //     //       item_category: "Opportunity",
  //     //       price: item.priceInUSD,
  //     //       quantity: 1,
  //     //     },
  //     //   ],
  //     // });
  //   },
  //   [id, title],
  // );
  const { data: session } = useSession();
  const [file_Certificate, setFile_Certificate] = useState<any>();
  const [file_Picture, setFile_Picture] = useState<any>();
  const [file_VoiceNote, setFile_VoiceNote] = useState<any>();

  const onSubmitOpportunity = useCallback(() => {
    if (!session) {
      toast.warning("You need to be logged in to save an opportunity");
      return;
    }

    debugger;

    // validate files and toast
    if (!file_Certificate || !file_Picture || !file_VoiceNote) {
      toast.warning("Please upload all required files");
      return;
    }

    var request: MyOpportunityRequestVerify = {
      certificate: file_Certificate,
      picture: file_Picture,
      voiceNote: file_VoiceNote,
      dateStart: null,
      dateEnd: null,
    };

    performActionSendForVerificationManual(opportunityInfo?.id!, request)
      .then((res) => {
        toast.success("Opportunity saved");
      })
      .catch((err) => {
        toast.error("Error");
      });
  }, [
    file_Certificate,
    file_Picture,
    file_VoiceNote,
    performActionSendForVerificationManual,
  ]);

  return (
    <div key={`OpportunityComplete_${id}`} className="flex flex-col gap-2">
      <div className="flex flex-row bg-green p-4 shadow-lg">
        <h1 className="flex-grow"></h1>
        <button
          type="button"
          className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
          onClick={onClose}
        >
          <IoMdClose className="h-6 w-6"></IoMdClose>
        </button>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white p-4 shadow-lg">
          <Image
            src={iconSuccess}
            alt="Icon Success"
            width={28}
            height={28}
            sizes="100vw"
            priority={true}
            style={{
              width: "28px",
              height: "28px",
            }}
          />
        </div>
        <h4>Well done for completing this opportunity!</h4>
        <div className="text-gray-dark">
          Upload the required documents below, and once
          <br />
          approved, we'll add the accreditation to your CV!
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-2">
          {opportunityInfo?.verificationTypes?.find(
            (x) => x.type == "FileUpload",
          ) && (
            <FileUpload
              id="fileUploadFileUpload"
              files={file_Certificate ? [file_Certificate] : []}
              fileTypes={ACCEPTED_DOC_TYPES.join(",")}
              fileTypesLabels={ACCEPTED_DOC_TYPES_LABEL}
              allowMultiple={true}
              label={
                opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "FileUpload",
                )?.description
              }
              icon={iconCertificate}
              onUploadComplete={(files) => {
                setFile_Certificate(files[0]);
              }}
            />
          )}

          {opportunityInfo?.verificationTypes?.find(
            (x) => x.type == "Picture",
          ) && (
            <FileUpload
              id="fileUploadPicture"
              files={file_Picture ? [file_Picture] : []}
              fileTypes={ACCEPTED_DOC_TYPES.join(",")}
              fileTypesLabels={ACCEPTED_DOC_TYPES_LABEL}
              allowMultiple={true}
              label={
                opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "Picture",
                )?.description
              }
              icon={iconPicture}
              onUploadComplete={(files) => {
                setFile_Picture(files[0]);
              }}
            />
          )}

          {opportunityInfo?.verificationTypes?.find(
            (x) => x.type == "VoiceNote",
          ) && (
            <FileUpload
              id="fileUploadVoiceNote"
              files={file_VoiceNote ? [file_VoiceNote] : []}
              fileTypes={ACCEPTED_DOC_TYPES.join(",")}
              fileTypesLabels={ACCEPTED_DOC_TYPES_LABEL}
              allowMultiple={true}
              label={
                opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "VoiceNote",
                )?.description
              }
              icon={iconVideo}
              onUploadComplete={(files) => {
                setFile_VoiceNote(files[0]);
              }}
            />
          )}

          {opportunityInfo?.verificationTypes?.find(
            (x) => x.type == "Location",
          ) && (
            <div>TODO: pin</div>
            // <FileUpload
            //   id="fileUploadVideo"
            //   files={fileVideo ? [fileVideo] : []}
            //   fileTypes={ACCEPTED_DOC_TYPES.join(",")}
            //   fileTypesLabels={ACCEPTED_DOC_TYPES_LABEL}
            //   allowMultiple={true}
            //   label="Video"
            //   icon={iconVideo}
            //   onUploadComplete={(files) => {
            //     setFileVideo(files[0]);
            //   }}
            // />
          )}
        </div>

        <div className="mt-4 flex flex-grow gap-4">
          <button
            type="button"
            className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[300px]"
            onClick={onSave}
          >
            <Image
              src={iconBookmark}
              alt="Icon Bookmark"
              width={20}
              height={20}
              sizes="100vw"
              priority={true}
              style={{ width: "20px", height: "20px" }}
            />

            <span className="ml-1">Cancel</span>
          </button>
          <button
            type="button"
            className="btn rounded-full bg-purple normal-case text-white md:w-[250px]"
            onClick={onSubmitOpportunity}
            //  disabled={!opportunity?.uRL}
          >
            <Image
              src={iconOpen}
              alt="Icon Open"
              width={20}
              height={20}
              sizes="100vw"
              priority={true}
              style={{ width: "20px", height: "20px" }}
            />

            <span className="ml-1">Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
