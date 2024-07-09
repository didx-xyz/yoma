import Image from "next/image";
import Link from "next/link";
import type { data } from "~/api/models/opportunity";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import {
  IoMdCalendar,
  IoMdPlay,
  IoMdCloudUpload,
  IoMdWarning,
  IoMdBookmark,
  IoMdCheckmark,
  IoMdClose,
  IoMdShare,
} from "react-icons/io";
import { AvatarImage } from "../AvatarImage";
import Badges from "./Badges";
interface InputProps {
  data: data;
  preview?: boolean;
  [key: string]: any;
}

const OpportunityPublicDetailsComponent: React.FC<InputProps> = ({
  data,
  preview,
}) => {


  return preview ? (
    <div className="flex flex-col gap-4">
    <div className="relative flex flex-grow flex-row gap-1 rounded-lg bg-white p-4 shadow-lg md:p-6">
      <div className="flex flex-grow flex-col gap-1">
        <div className="flex flex-grow flex-col">
          <div className="relative flex justify-start">
            <h4 className="max-w-[215px] text-xl font-semibold leading-7 text-black md:max-w-[1125px] md:text-2xl md:leading-8">
              {data.title}
            </h4>
            <div className="absolute -right-2 -top-2 md:right-0 md:top-0">
              <AvatarImage
                icon={data.organizationLogoURL ?? null}
                alt="Company Logo"
                size={60}
                // sizeMobile={42}
              />
            </div>
          </div>

          <h6 className="max-w-[215px] text-sm text-gray-dark md:max-w-[1125px]">
            By {data.organizationName}
          </h6>

          {/* BADGES */}
          <Badges opportunity={data} />

          {/* DATES */}
          {data.status == "Active" && (
            <div className="flex flex-col text-sm text-gray-dark">
              <div>
                {data.dateStart && (
                  <>
                    <span className="mr-2 font-bold">Starts:</span>
                    <span className="text-xs tracking-widest text-black">
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {data.dateStart}
                      </Moment>
                    </span>
                  </>
                )}
              </div>
              <div>
                {data.dateEnd && (
                  <>
                    <span className="mr-2 font-bold">Ends:</span>
                    <span className="text-xs tracking-widest text-black">
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {data.dateEnd}
                      </Moment>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-4 flex flex-col gap-4 md:flex-row">
            <div className="flex flex-grow flex-col gap-4 md:flex-row">
              {data.url &&
                data.status !== "Expired" && (
                  <button
                    type="button"
                    className="btn btn-sm h-10 w-full rounded-full bg-green normal-case text-white hover:bg-green-dark md:w-[250px]"
                    onClick={() =>
                      setGotoOpportunityDialogVisible(true)
                    }
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

                    <span className="ml-1">Go to opportunity</span>
                  </button>
                )}

              {/* only show upload button if verification is enabled and method is manual */}
              {data.verificationEnabled &&
                data.verificationMethod == "Manual" && (
                  <>
                    {/* only show completion button if start date has been reached,
                         not yet completed or rejected */}
                    {new Date(data.dateStart) <
                      new Date() &&
                      (verificationStatus == null ||
                        verificationStatus == undefined ||
                        verificationStatus.status == "None" ||
                        verificationStatus.status == "Rejected") &&
                      !data.participantLimitReached &&
                      !verificationStatusIsLoading && (
                        <button
                          type="button"
                          className="btn btn-sm h-10 w-full rounded-full border-green bg-white normal-case text-green hover:bg-green-dark hover:text-white md:w-[280px]"
                          onClick={() =>
                            user
                              ? setCompleteOpportunityDialogVisible(
                                  true,
                                )
                              : setLoginDialogVisible(true)
                          }
                        >
                          <Image
                            src={iconUpload}
                            alt="Icon Upload"
                            width={20}
                            height={20}
                            sizes="100vw"
                            priority={true}
                            style={{
                              width: "20px",
                              height: "20px",
                            }}
                          />

                          <span className="ml-1">
                            Upload your completion files
                          </span>
                        </button>
                      )}

                    {verificationStatus &&
                      verificationStatus.status == "Pending" && (
                        <button
                          type="button"
                          className="btn btn-sm h-10 w-full rounded-full border-0 bg-gray-light normal-case text-gray-dark hover:bg-green-dark hover:text-white md:w-[250px]"
                          onClick={() =>
                            setCancelOpportunityDialogVisible(true)
                          }
                        >
                          Pending verification
                          <IoMdClose className="ml-1 mt-[2px] h-4 w-4 text-gray-dark" />
                        </button>
                      )}

                    {verificationStatus &&
                      verificationStatus.status == "Completed" && (
                        <div className="md:text-md flex h-10 items-center justify-center rounded-full border border-purple bg-white px-4 text-center text-sm font-bold text-purple">
                          Completed
                          <IoMdCheckmark
                            strikethroughThickness={2}
                            overlineThickness={2}
                            underlineThickness={2}
                            className="ml-1 h-4 w-4 text-green"
                          />
                        </div>
                      )}
                  </>
                )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className={
                  "btn btn-sm h-10 w-full flex-shrink flex-nowrap rounded-full border-gray-dark normal-case text-gray-dark disabled:text-gray-dark md:max-w-[120px] " +
                  ` ${
                    isOppSaved
                      ? "border-yellow bg-yellow-light text-yellow"
                      : "bg-white hover:bg-green-dark hover:text-white"
                  }`
                }
                onClick={onUpdateSavedOpportunity}
                disabled={
                  !(
                    data.published &&
                    data.status == "Active"
                  )
                }
              >
                <IoMdBookmark className="mr-1 h-5 w-5" />

                {isOppSaved ? "Saved" : "Save"}
              </button>

              <button
                type="button"
                className="btn btn-sm h-10 w-full flex-shrink flex-nowrap rounded-full border-gray-dark bg-white normal-case text-gray-dark hover:bg-green-dark hover:text-white disabled:text-gray-dark md:max-w-[120px]"
                onClick={onShareOpportunity}
                // ensure opportunity is published and active (user logged in check is done in function)
                disabled={
                  !(
                    data.published &&
                    data.status == "Active"
                  )
                }
              >
                <IoMdShare className="mr-1 h-5 w-5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-grow rounded-lg bg-white p-4 shadow-lg md:w-[66%] md:p-6">
        <div style={{ whiteSpace: "pre-wrap" }}>
          {data.description}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
        <div className="flex flex-col gap-1 rounded-lg bg-white p-4 md:p-6">
          <div>
            <div className="mt-2 flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconSkills}
                alt="Icon Skills"
                width={20}
                height={20}
                sizes="100vw"
                priority={true}
                style={{ width: "20px", height: "20px" }}
              />
              <span className="ml-1">Skills you will learn</span>
            </div>
            <div className="my-2 flex flex-wrap gap-1">
              {data.skills?.map((item) => (
                <div
                  key={item.id}
                  className="badge bg-green px-2 py-1 text-white"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="divider mt-2" />
          <div>
            <div className="flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconClock}
                alt="Icon Clock"
                width={23}
                height={23}
                sizes="100vw"
                priority={true}
                style={{ width: "23px", height: "23px" }}
              />

              <span className="ml-1">
                How much time you will need
              </span>
            </div>
            {/* <div className="my-2 text-sm">{`This task should not take you more than ${data.commitmentIntervalCount} ${data.commitmentInterval}`}</div> */}
            <div className="my-2 text-sm">
              {`This task should not take you more than ${
                data.commitmentIntervalCount
              } ${data.commitmentInterval}${
                data.commitmentIntervalCount > 1
                  ? "s. "
                  : ". "
              }`}
              <br />
              <p className="mt-2">
                The estimated times provided are just a guideline. You
                have as much time as you need to complete the tasks at
                your own pace. Focus on engaging with the materials
                and doing your best without feeling rushed by the time
                estimates.
              </p>
            </div>
          </div>
          <div className="divider mt-2" />
          <div>
            <div className="flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconTopics}
                alt="Icon Topics"
                width={20}
                height={20}
                sizes="100vw"
                priority={true}
                style={{ width: "20px", height: "20px" }}
              />

              <span className="ml-1">Topics</span>
            </div>
            <div className="my-2 flex flex-wrap gap-1">
              {data.categories?.map((item) => (
                <div
                  key={item.id}
                  className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="divider mt-2" />
          <div>
            <div className="flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconLanguage}
                alt="Icon Language"
                width={20}
                height={20}
                sizes="100vw"
                priority={true}
                style={{ width: "20px", height: "20px" }}
              />

              <span className="ml-1">Languages</span>
            </div>
            <div className="my-2 flex flex-wrap gap-1">
              {data.languages?.map((item) => (
                <div
                  key={item.id}
                  className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="divider mt-2" />
          <div>
            <div className="flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconDifficulty}
                alt="Icon Difficulty"
                width={20}
                height={20}
                sizes="100vw"
                priority={true}
                style={{ width: "20px", height: "20px" }}
              />

              <span className="ml-1">Course difficulty</span>
            </div>
            <div className="my-2 text-sm">
              {data.difficulty}
            </div>
          </div>
          <div className="divider mt-1" />
          <div>
            <div className="flex flex-row items-center gap-1 text-sm font-bold">
              <Image
                src={iconLocation}
                alt="Icon Location"
                width={20}
                height={20}
                sizes="100vw"
                priority={true}
                style={{ width: "20px", height: "20px" }}
              />

              <span className="ml-1">Countries</span>
            </div>
            <div className="my-2 flex flex-wrap gap-1">
              {data.countries?.map((country) => (
                <div
                  key={country.id}
                  className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                >
                  {country.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export { OpportunityPublicDetailsComponent };
