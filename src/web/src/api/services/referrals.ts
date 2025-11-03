import { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import {
  Program,
  ProgramRequestCreate,
  ProgramRequestUpdate,
  ProgramSearchFilterAdmin,
  ProgramSearchResults,
  ProgramStatus,
  PathwayCompletionRule,
  PathwayTaskEntityType,
  PathwayOrderMode,
  ReferralLink,
  ReferralLinkStatus,
  ReferralLinkSearchFilter,
  ReferralLinkSearchResults,
  ReferralLinkRequestCreate,
  ReferralLinkRequestUpdate,
  ReferralLinkUsageStatus,
  ReferralLinkUsageInfo,
  ReferralLinkUsageSearchFilter,
  ReferralLinkUsageSearchFilterAdmin,
  ReferralLinkUsageSearchResults,
  ProofOfPersonhoodMethod,
  ProgramSearchFilter,
  ProgramSearchResultsInfo,
  ProgramInfo,
  BlockRequest,
  UnblockRequest,
  BlockReason,
} from "../models/referrals";

// 🧪 MOCK DATA CONFIGURATION
// ==================================================================================
// Toggle between mock data and real API endpoints using the environment variable:
//   NEXT_PUBLIC_REFERRALS_USE_MOCK_DATA=true   - Use mock data (default for development)
//   NEXT_PUBLIC_REFERRALS_USE_MOCK_DATA=false  - Use real API endpoints
//
// Set this in your .env.local file or environment configuration.
//
// All service methods now respect the USE_MOCK_DATA flag:
//   ✅ getReferralProgramById
//   ✅ searchReferralPrograms
//   ✅ createReferralProgram
//   ✅ updateReferralProgram
//   ✅ updateReferralProgramStatus
//   ✅ setReferralProgramAsDefault
//   ✅ getReferralLinkById
//   ✅ searchReferralLinks
//   ✅ createReferralLink
//   ✅ updateReferralLink
//   ✅ cancelReferralLink
//   ✅ getReferralLinkUsageById
//   ✅ getReferralLinkUsageByIdAsReferee
//   ✅ searchReferralLinkUsagesAsReferrer
//   ✅ searchReferralLinkUsagesAsReferee
//   ✅ searchReferralLinkUsagesAdmin
//   ✅ claimReferralLinkAsReferee
//   ✅ searchReferralLinksAdmin
//   ✅ getBlockReasons
//
// Note: The following methods always use real API (no mock implementation):
//   - getAvailableReferralPrograms
//   - getDefaultReferralProgram
//   - searchReferralProgramsInfo
//   - getReferralProgramInfoById
//   - getReferralStatus
//   - blockReferrer
//   - unblockReferrer
// ==================================================================================
const USE_MOCK_DATA = false;

// 🧪 MOCK DATA for UI development (remove when API is implemented)
const MOCK_PROGRAMS: Program[] = [
  {
    id: "1",
    name: "Default Referral Program",
    description: "Main referral program for new users",
    imageId: null,
    imageURL: null,
    completionBalance: 0,
    completionWindowInDays: 30,
    completionLimitReferee: 100,
    completionLimit: 1000,
    completionTotal: 234,
    zltoRewardReferrer: 5.0,
    zltoRewardReferee: 10.0,
    zltoRewardPool: 50000.0,
    zltoRewardCumulative: 2340.0,
    zltoRewardBalance: 47660.0,
    proofOfPersonhoodRequired: true,
    pathwayRequired: true,
    multipleLinksAllowed: false,
    statusId: "1",
    status: "Active",
    isDefault: true,
    dateStart: new Date().toISOString(),
    dateEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    dateCreated: new Date().toISOString(),
    createdByUserId: "user1",
    dateModified: new Date().toISOString(),
    modifiedByUserId: "user1",
    pathway: {
      id: "pathway1",
      programId: "1",
      name: "Onboarding Pathway",
      description: "Complete these steps to finish onboarding",
      rule: PathwayCompletionRule.All,
      orderMode: PathwayOrderMode.Sequential,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      steps: [
        {
          id: "step1",
          pathwayId: "pathway1",
          name: "Complete Profile",
          description: "Fill out your profile information",
          rule: PathwayCompletionRule.All,
          orderMode: PathwayOrderMode.Sequential,
          order: 1,
          orderDisplay: 1,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          tasks: [
            {
              id: "task1",
              stepId: "step1",
              entityType: PathwayTaskEntityType.Opportunity,
              opportunity: { id: "opp1", title: "Profile Setup" },
              order: 1,
              orderDisplay: 1,
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
            },
          ],
        },
        {
          id: "step2",
          pathwayId: "pathway1",
          name: "Complete First Activity",
          description: "Choose and complete all activities",
          rule: PathwayCompletionRule.All,
          orderMode: PathwayOrderMode.Sequential,
          order: 2,
          orderDisplay: 2,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          tasks: [
            {
              id: "task2",
              stepId: "step2",
              entityType: PathwayTaskEntityType.Opportunity,
              opportunity: { id: "opp2", title: "Activity A" },
              order: 1,
              orderDisplay: 1,
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
            },
            {
              id: "task3",
              stepId: "step2",
              entityType: PathwayTaskEntityType.Opportunity,
              opportunity: { id: "opp3", title: "Activity B" },
              order: 2,
              orderDisplay: 2,
              dateCreated: new Date().toISOString(),
              dateModified: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  },
  {
    id: "2",
    name: "Summer Campaign 2025",
    description: "Special summer referral campaign",
    imageId: null,
    imageURL: null,
    completionBalance: 0,
    completionWindowInDays: 60,
    completionLimitReferee: 50,
    completionLimit: 500,
    completionTotal: 89,
    zltoRewardReferrer: 10.0,
    zltoRewardReferee: 15.0,
    zltoRewardPool: 25000.0,
    zltoRewardCumulative: 2225.0,
    zltoRewardBalance: 22775.0,
    proofOfPersonhoodRequired: true,
    pathwayRequired: false,
    multipleLinksAllowed: true,
    statusId: "1",
    status: "Active",
    isDefault: false,
    dateStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    dateCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdByUserId: "user1",
    dateModified: new Date().toISOString(),
    modifiedByUserId: "user1",
    pathway: null,
  },
  {
    id: "3",
    name: "Inactive Test Program",
    description: "This program is currently inactive",
    imageId: null,
    imageURL: null,
    completionBalance: 0,
    completionWindowInDays: null,
    completionLimitReferee: null,
    completionLimit: null,
    completionTotal: 0,
    zltoRewardReferrer: 3.0,
    zltoRewardReferee: 5.0,
    zltoRewardPool: null,
    zltoRewardCumulative: 0,
    zltoRewardBalance: null,
    proofOfPersonhoodRequired: false,
    pathwayRequired: false,
    multipleLinksAllowed: false,
    statusId: "2",
    status: "Inactive",
    isDefault: false,
    dateStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    dateEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateCreated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdByUserId: "user1",
    dateModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedByUserId: "user1",
    pathway: null,
  },
];

// create/edit/info
export const getReferralProgramById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));
    const program = MOCK_PROGRAMS.find((p) => p.id === id);
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }
    return program;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Program>(`/referral/program/${id}/admin`);
  return data;
};

export const searchReferralPrograms = async (
  filter: ProgramSearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const pageNumber = filter.pageNumber ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = MOCK_PROGRAMS.slice(startIndex, endIndex);

    return {
      items,
      totalCount: MOCK_PROGRAMS.length,
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ProgramSearchResults>(
    `/referral/program/search/admin`,
    filter,
  );
  return data;
};

export const createReferralProgram = async (
  request: ProgramRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newProgram: Program = {
      id: `${MOCK_PROGRAMS.length + 1}`,
      name: "New Program",
      description: "Newly created program",
      imageId: null,
      imageURL: null,
      completionBalance: 0,
      completionWindowInDays: 30,
      completionLimitReferee: null,
      completionLimit: null,
      completionTotal: 0,
      zltoRewardReferrer: null,
      zltoRewardReferee: null,
      zltoRewardPool: null,
      zltoRewardCumulative: 0,
      zltoRewardBalance: null,
      proofOfPersonhoodRequired: false,
      pathwayRequired: false,
      multipleLinksAllowed: false,
      statusId: "1",
      status: "Active",
      isDefault: false,
      dateStart: new Date().toISOString(),
      dateEnd: null,
      dateCreated: new Date().toISOString(),
      createdByUserId: "user1",
      dateModified: new Date().toISOString(),
      modifiedByUserId: "user1",
      pathway: null,
    };

    MOCK_PROGRAMS.push(newProgram);
    return newProgram;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<Program>(
    `/referral/program/create`,
    request,
  );
  return data;
};

export const updateReferralProgram = async (
  request: ProgramRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const program = MOCK_PROGRAMS[0]; // Return first program as updated
    return {
      ...program,
      dateModified: new Date().toISOString(),
    } as Program;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/update`,
    request,
  );
  return data;
};

export const updateReferralProgramStatus = async (
  id: string,
  status: ProgramStatus,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const program = MOCK_PROGRAMS.find((p) => p.id === id);
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }

    return {
      ...program,
      status: status,
      dateModified: new Date().toISOString(),
    } as Program;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/${status}`,
  );
  return data;
};

export const setReferralProgramAsDefault = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const program = MOCK_PROGRAMS.find((p) => p.id === id);
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }

    return {
      ...program,
      isDefault: true,
      dateModified: new Date().toISOString(),
    } as Program;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/default`,
  );
  return data;
};

export const updateReferralProgramImage = async (
  id: string,
  file: File,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Program> => {
  // Real API call (no mock implementation for file uploads)
  const instance = context ? ApiServer(context) : await ApiClient;

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await instance.patch<Program>(
    `/referral/program/${id}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
};

// 🧪 MOCK DATA for Referral Links - Generate links for all programs
const generateMockReferralLinks = (): ReferralLink[] => {
  const links: ReferralLink[] = [];

  // Mock status IDs for usage counts
  const STATUS_ID_PENDING = "pending-status-id";
  const STATUS_ID_COMPLETED = "completed-status-id";
  const STATUS_ID_EXPIRED = "expired-status-id";

  // For each program, create multiple links
  MOCK_PROGRAMS.forEach((program, programIndex) => {
    // Active link
    links.push({
      id: `link-${program.id}-1`,
      name: `${program.name} - Link 1`,
      description: `Primary referral link for ${program.name}`,
      programId: program.id,
      programName: program.name,
      userId: "user1",
      userDisplayName: "John Smith",
      userEmail: "john.smith@example.com",
      userPhoneNumber: "+123456789g0",
      blocked: true,
      blockedDate: new Date().toISOString(),
      statusId: "1",
      status: ReferralLinkStatus.Active,
      url: `https://yoma.world/referral?code=PROG${program.id}LINK1`,
      shortURL: `https://yoma.world/r/P${program.id}L1`,
      qrCodeBase64:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",

      zltoRewardCumulative:
        (12 + programIndex * 3) * (program.zltoRewardReferrer ?? 0),
      pendingTotal: 5 + programIndex * 2,
      completionTotal: 12 + programIndex * 3,
      expiredTotal: 2,
      dateCreated: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dateModified: new Date().toISOString(),
    });

    // Another active link
    links.push({
      id: `link-${program.id}-2`,
      name: `${program.name} - Link 2`,
      description: `Secondary referral link for ${program.name}`,
      programId: program.id,
      programName: program.name,
      userId: "user1",
      userDisplayName: "Jane Doe",
      userEmail: "jane.doe@example.com",
      userPhoneNumber: "+1987654321",
      blocked: false,
      blockedDate: null,
      statusId: "1",
      status: ReferralLinkStatus.Active,
      url: `https://yoma.world/referral?code=PROG${program.id}LINK2`,
      shortURL: `https://yoma.world/r/P${program.id}L2`,
      qrCodeBase64: null,
      zltoRewardCumulative: 8 * (program.zltoRewardReferrer ?? 0),
      pendingTotal: 5 + programIndex * 2,
      completionTotal: 12 + programIndex * 3,
      expiredTotal: 1,
      dateCreated: new Date(
        Date.now() - 20 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dateModified: new Date().toISOString(),
    });

    // Cancelled link
    links.push({
      id: `link-${program.id}-3`,
      name: `${program.name} - Cancelled Link`,
      description: "This link was cancelled",
      programId: program.id,
      programName: program.name,
      userId: "user2",
      userDisplayName: "Bob Anderson",
      userEmail: "bob.anderson@example.com",
      userPhoneNumber: null,
      blocked: false,
      blockedDate: null,
      statusId: "2",
      status: ReferralLinkStatus.Cancelled,
      url: `https://yoma.world/referral?code=PROG${program.id}OLDLINK`,
      shortURL: `https://yoma.world/r/P${program.id}OLD`,
      qrCodeBase64: null,
      zltoRewardCumulative: 3 * (program.zltoRewardReferrer ?? 0),
      pendingTotal: 5 + programIndex * 2,
      expiredTotal: 0,
      completionTotal: 12 + programIndex * 3,
      dateCreated: new Date(
        Date.now() - 45 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dateModified: new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    // Limit reached link
    links.push({
      id: `link-${program.id}-4`,
      name: `${program.name} - Limit Reached`,
      description: "This link has reached its usage limit",
      programId: program.id,
      programName: program.name,
      userId: "user1",
      userDisplayName: "John Smith",
      userEmail: "john.smith@example.com",
      userPhoneNumber: "+1234567890",
      blocked: false,
      blockedDate: null,
      statusId: "3",
      status: ReferralLinkStatus.LimitReached,
      url: `https://yoma.world/referral?code=PROG${program.id}FULL`,
      shortURL: `https://yoma.world/r/P${program.id}F`,
      qrCodeBase64: null,
      zltoRewardCumulative: 50 * (program.zltoRewardReferrer ?? 0),
      pendingTotal: 5 + programIndex * 2,
      completionTotal: 12 + programIndex * 3,
      expiredTotal: 5,
      dateCreated: new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dateModified: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    // Expired link
    links.push({
      id: `link-${program.id}-5`,
      name: `${program.name} - Expired Link`,
      description: "This link has expired",
      programId: program.id,
      programName: program.name,
      userId: "user3",
      userDisplayName: "Sarah Williams",
      userEmail: "sarah.williams@example.com",
      userPhoneNumber: "+1555123456",
      blocked: false,
      blockedDate: null,
      statusId: "4",
      status: ReferralLinkStatus.Expired,
      url: `https://yoma.world/referral?code=PROG${program.id}EXPIRED`,
      shortURL: `https://yoma.world/r/P${program.id}E`,
      qrCodeBase64: null,
      zltoRewardCumulative: 10 * (program.zltoRewardReferrer ?? 0),
      pendingTotal: 5 + programIndex * 2,
      completionTotal: 12 + programIndex * 3,
      expiredTotal: 3,
      dateCreated: new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dateModified: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  });

  return links;
};

const MOCK_REFERRAL_LINKS = generateMockReferralLinks();

export const getReferralLinkById = async (
  id: string,
  includeQRCode?: boolean,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));
    const link = MOCK_REFERRAL_LINKS.find((l) => l.id === id);
    if (!link) {
      // If not found, return the first link as fallback for testing
      console.warn(
        `Referral link with id ${id} not found, returning first link as fallback`,
      );
      if (MOCK_REFERRAL_LINKS.length === 0) {
        throw new Error("No mock referral links available");
      }
      return MOCK_REFERRAL_LINKS[0]!;
    }
    return link;
  }

  // Real API call - include QR code parameter
  const instance = context ? ApiServer(context) : await ApiClient;
  const params = includeQRCode !== undefined ? { includeQRCode } : {};
  const { data } = await instance.get<ReferralLink>(`/referral/link/${id}`, {
    params,
  });
  return data;
};

export const searchReferralLinks = async (
  filter: ReferralLinkSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredLinks = [...MOCK_REFERRAL_LINKS];

    // Filter by programId
    if (filter.programId) {
      filteredLinks = filteredLinks.filter(
        (link) => link.programId === filter.programId,
      );
    }

    // Filter by valueContains
    if (filter.valueContains) {
      const searchTerm = filter.valueContains.toLowerCase();
      filteredLinks = filteredLinks.filter(
        (link) =>
          link.name.toLowerCase().includes(searchTerm) ||
          link.description?.toLowerCase().includes(searchTerm),
      );
    }

    // Filter by statuses
    //   if (filter.statuses && filter.statuses.length > 0) {
    //     filteredLinks = filteredLinks.filter((link) =>
    //       filter.statuses!.includes(link.status),
    //     );
    //   }

    const pageNumber = filter.pageNumber ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredLinks.slice(startIndex, endIndex);

    return {
      items,
      totalCount: filteredLinks.length,
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkSearchResults>(
    `/referral/link/search`,
    filter,
  );
  return data;
};

export const createReferralLink = async (
  request: ReferralLinkRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const program = MOCK_PROGRAMS.find((p) => p.id === request.programId);

    const newLink: ReferralLink = {
      id: `link${MOCK_REFERRAL_LINKS.length + 1}`,
      name: request.name,
      description: request.description,
      programId: request.programId,
      programName: program?.name ?? "Unknown Program",
      userId: "user1",
      userDisplayName: "Current User",
      userEmail: "current.user@example.com",
      userPhoneNumber: "+1234567890",
      blocked: false,
      blockedDate: null,
      statusId: "1",
      status: ReferralLinkStatus.Active,
      url: `https://yoma.world/referral?code=${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      shortURL: `https://yoma.world/r/${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      qrCodeBase64: request.includeQRCode
        ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        : null,
      zltoRewardCumulative: 0,
      pendingTotal: 0,
      completionTotal: 0,
      expiredTotal: 0,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };

    MOCK_REFERRAL_LINKS.push(newLink);
    return newLink;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLink>(
    `/referral/link/create`,
    request,
  );
  return data;
};

export const updateReferralLink = async (
  request: ReferralLinkRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const link = MOCK_REFERRAL_LINKS.find((l) => l.id === request.id);
    if (!link) {
      throw new Error(`Referral link with id ${request.id} not found`);
    }

    const updatedLink: ReferralLink = {
      ...link,
      name: request.name,
      description: request.description,
    };

    return updatedLink;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<ReferralLink>(
    `/referral/link/update`,
    request,
  );
  return data;
};

export const cancelReferralLink = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLink> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const link = MOCK_REFERRAL_LINKS.find((l) => l.id === id);
    if (!link) {
      throw new Error(`Referral link with id ${id} not found`);
    }

    return {
      ...link,
      status: ReferralLinkStatus.Cancelled,
      statusId: "2",
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<ReferralLink>(
    `/referral/link/${id}/cancel`,
  );
  return data;
};

// 🧪 MOCK DATA for Referral Link Usages - Generate usages for all links
const generateMockLinkUsages = (): ReferralLinkUsageInfo[] => {
  const usages: ReferralLinkUsageInfo[] = [];
  const mockReferralLinks = generateMockReferralLinks();

  // For each active link, create multiple usages
  mockReferralLinks
    .filter((link) => link.status === ReferralLinkStatus.Active)
    .forEach((link, linkIndex) => {
      const program = MOCK_PROGRAMS.find((p) => p.id === link.programId);
      if (!program) return;

      // Completed usage
      usages.push({
        id: `usage-${link.id}-1`,
        programId: program.id,
        programName: program.name,
        linkId: link.id,
        linkName: link.name,
        // Referrer info (from link)
        userIdReferrer: link.userId,
        userDisplayNameReferrer: link.userDisplayName,
        userEmailReferrer: link.userEmail,
        userPhoneNumberReferrer: link.userPhoneNumber,
        // Referee info
        userId: `referee-${linkIndex}-1`,
        userDisplayName: `John Doe ${linkIndex + 1}`,
        userEmail: `john.doe${linkIndex + 1}@example.com`,
        userPhoneNumber: `+123456789${linkIndex}`,
        statusId: "2",
        status: ReferralLinkUsageStatus.Completed,
        dateClaimed: new Date(
          Date.now() - (15 + linkIndex * 2) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        dateCompleted: new Date(
          Date.now() - (10 + linkIndex * 2) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        dateExpired: null,
        proofOfPersonhoodCompleted: true,
        proofOfPersonhoodMethod: ProofOfPersonhoodMethod.OTP,
        pathwayComplete: true,
        percentComplete: 100,
        pathway: program.pathway
          ? {
              id: program.pathway.id,
              name: program.pathway.name,
              rule: program.pathway.rule,
              orderMode: program.pathway.orderMode,
              completed: true,
              dateCompleted: new Date(
                Date.now() - (10 + linkIndex * 2) * 24 * 60 * 60 * 1000,
              ).toISOString(),
              stepsTotal: program.pathway.steps?.length ?? 0,
              stepsCompleted: program.pathway.steps?.length ?? 0,
              percentComplete: 100,
              steps:
                program.pathway.steps?.map((step) => ({
                  id: step.id,
                  name: step.name,
                  rule: step.rule as PathwayCompletionRule,
                  orderMode: step.orderMode,
                  order: step.order,
                  orderDisplay: step.orderDisplay,
                  completed: true,
                  dateCompleted: new Date(
                    Date.now() - (10 + linkIndex * 2) * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                  tasksTotal: step.tasks?.length ?? 0,
                  tasksCompleted: step.tasks?.length ?? 0,
                  percentComplete: 100,
                  tasks:
                    step.tasks?.map((task, taskIndex) => ({
                      id: task.id,
                      entityType: task.entityType as PathwayTaskEntityType,
                      opportunity: task.opportunity,
                      order: task.order,
                      orderDisplay: task.orderDisplay,
                      completed: taskIndex % 2 === 0, // Only even-indexed tasks (0, 2, 4...) are completed
                      dateCompleted:
                        taskIndex % 2 === 0
                          ? new Date(
                              Date.now() -
                                (10 + linkIndex * 2) * 24 * 60 * 60 * 1000,
                            ).toISOString()
                          : null,
                    })) ?? [],
                })) ?? [],
            }
          : null,
      });

      // Pending usage
      usages.push({
        id: `usage-${link.id}-2`,
        programId: program.id,
        programName: program.name,
        linkId: link.id,
        linkName: link.name,
        // Referrer info (from link)
        userIdReferrer: link.userId,
        userDisplayNameReferrer: link.userDisplayName,
        userEmailReferrer: link.userEmail,
        userPhoneNumberReferrer: link.userPhoneNumber,
        // Referee info
        userId: `referee-${linkIndex}-2`,
        userDisplayName: `Jane Smith ${linkIndex + 1}`,
        userEmail: `jane.smith${linkIndex + 1}@example.com`,
        userPhoneNumber: null,
        statusId: "1",
        status: ReferralLinkUsageStatus.Pending,
        dateClaimed: new Date(
          Date.now() - (5 + linkIndex) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        dateCompleted: null,
        dateExpired: null,
        proofOfPersonhoodCompleted: true,
        proofOfPersonhoodMethod: ProofOfPersonhoodMethod.SocialLogin,
        pathwayComplete: false,
        percentComplete: 60,
        pathway: program.pathway
          ? {
              id: program.pathway.id,
              name: program.pathway.name,
              rule: program.pathway.rule,
              orderMode: program.pathway.orderMode,
              completed: false,
              dateCompleted: null,
              stepsTotal: program.pathway.steps?.length ?? 0,
              stepsCompleted: 1,
              percentComplete: 60,
              steps:
                program.pathway.steps?.map((step, stepIndex) => ({
                  id: step.id,
                  name: step.name,
                  rule: step.rule as PathwayCompletionRule,
                  orderMode: step.orderMode,
                  order: step.order,
                  orderDisplay: step.orderDisplay,
                  completed: stepIndex === 0, // Only first step completed
                  dateCompleted:
                    stepIndex === 0
                      ? new Date(
                          Date.now() - (5 + linkIndex) * 24 * 60 * 60 * 1000,
                        ).toISOString()
                      : null,
                  tasksTotal: step.tasks?.length ?? 0,
                  tasksCompleted:
                    stepIndex === 0 ? (step.tasks?.length ?? 0) : 0,
                  percentComplete: stepIndex === 0 ? 100 : 0,
                  tasks:
                    step.tasks?.map((task) => ({
                      id: task.id,
                      entityType: task.entityType as PathwayTaskEntityType,
                      opportunity: task.opportunity,
                      order: task.order,
                      orderDisplay: task.orderDisplay,
                      completed: stepIndex === 0,
                      dateCompleted:
                        stepIndex === 0
                          ? new Date(
                              Date.now() -
                                (5 + linkIndex) * 24 * 60 * 60 * 1000,
                            ).toISOString()
                          : null,
                    })) ?? [],
                })) ?? [],
            }
          : null,
      });

      // Another pending usage
      usages.push({
        id: `usage-${link.id}-3`,
        programId: program.id,
        programName: program.name,
        linkId: link.id,
        linkName: link.name,
        // Referrer info (from link)
        userIdReferrer: link.userId,
        userDisplayNameReferrer: link.userDisplayName,
        userEmailReferrer: link.userEmail,
        userPhoneNumberReferrer: link.userPhoneNumber,
        // Referee info
        userId: `referee-${linkIndex}-3`,
        userDisplayName: `Alice Johnson ${linkIndex + 1}`,
        userEmail: `alice.johnson${linkIndex + 1}@example.com`,
        userPhoneNumber: `+987654321${linkIndex}`,
        statusId: "1",
        status: ReferralLinkUsageStatus.Pending,
        dateClaimed: new Date(
          Date.now() - (3 + linkIndex) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        dateCompleted: null,
        dateExpired: null,
        proofOfPersonhoodCompleted: false,
        proofOfPersonhoodMethod: null,
        pathwayComplete: false,
        percentComplete: 30,
        pathway: program.pathway
          ? {
              id: program.pathway.id,
              name: program.pathway.name,
              rule: program.pathway.rule,
              orderMode: program.pathway.orderMode,
              completed: false,
              dateCompleted: null,
              stepsTotal: program.pathway.steps?.length ?? 0,
              stepsCompleted: 0,
              percentComplete: 30,
              steps:
                program.pathway.steps?.map((step, stepIndex) => ({
                  id: step.id,
                  name: step.name,
                  rule: step.rule as PathwayCompletionRule,
                  orderMode: step.orderMode,
                  order: step.order,
                  orderDisplay: step.orderDisplay,
                  completed: false,
                  dateCompleted: null,
                  tasksTotal: step.tasks?.length ?? 0,
                  tasksCompleted: stepIndex === 0 ? 1 : 0, // Partial progress on first step
                  percentComplete: stepIndex === 0 ? 50 : 0,
                  tasks:
                    step.tasks?.map((task, taskIndex) => ({
                      id: task.id,
                      entityType: task.entityType as PathwayTaskEntityType,
                      opportunity: task.opportunity,
                      order: task.order,
                      orderDisplay: task.orderDisplay,
                      completed: stepIndex === 0 && taskIndex === 0, // Only first task of first step completed
                      dateCompleted:
                        stepIndex === 0 && taskIndex === 0
                          ? new Date(
                              Date.now() -
                                (3 + linkIndex) * 24 * 60 * 60 * 1000,
                            ).toISOString()
                          : null,
                    })) ?? [],
                })) ?? [],
            }
          : null,
      });

      // Expired usage
      usages.push({
        id: `usage-${link.id}-4`,
        programId: program.id,
        programName: program.name,
        linkId: link.id,
        linkName: link.name,
        // Referrer info (from link)
        userIdReferrer: link.userId,
        userDisplayNameReferrer: link.userDisplayName,
        userEmailReferrer: link.userEmail,
        userPhoneNumberReferrer: link.userPhoneNumber,
        // Referee info
        userId: `referee-${linkIndex}-4`,
        userDisplayName: `Bob Wilson ${linkIndex + 1}`,
        userEmail: `bob.wilson${linkIndex + 1}@example.com`,
        userPhoneNumber: `+555123456${linkIndex}`,
        statusId: "3",
        status: ReferralLinkUsageStatus.Expired,
        dateClaimed: new Date(
          Date.now() - (70 + linkIndex * 5) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        dateCompleted: null,
        dateExpired: new Date(
          Date.now() - (10 + linkIndex) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        proofOfPersonhoodCompleted: false,
        proofOfPersonhoodMethod: null,
        pathwayComplete: false,
        percentComplete: 20,
        pathway: null,
      });
    });

  return usages;
};

const MOCK_LINK_USAGES = generateMockLinkUsages();

// User-facing program endpoints
export const getAvailableReferralPrograms = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<boolean> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<boolean>(`/referral/program/available`);
  return data;
};

export const getDefaultReferralProgram = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ProgramInfo>(
    `/referral/program/default/info`,
  );
  return data;
};

export const searchReferralProgramsInfo = async (
  filter: ProgramSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramSearchResultsInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ProgramSearchResultsInfo>(
    `/referral/program/search`,
    filter,
  );
  return data;
};

export const getReferralProgramInfoById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ProgramInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ProgramInfo>(
    `/referral/program/${id}/info`,
  );
  return data;
};

export const getReferralStatus = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<boolean> => {
  // This is now replaced by getAvailableReferralPrograms
  return getAvailableReferralPrograms(context);
};

export const getReferralLinkUsageById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageInfo> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const usage = MOCK_LINK_USAGES.find((u) => u.id === id);
    if (!usage) {
      throw new Error(`Link usage with id ${id} not found`);
    }

    return usage;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralLinkUsageInfo>(
    `/referral/link/usage/${id}`,
  );
  return data;
};

export const getReferralLinkUsageByIdAsReferee = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageInfo> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    const usage = MOCK_LINK_USAGES.find((u) => u.linkId === id);
    if (!usage) {
      throw new Error(`Link usage for link ${id} not found`);
    }

    return usage;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ReferralLinkUsageInfo>(
    `/referral/link/${id}/usage`,
  );
  return data;
};

export const searchReferralLinkUsagesAsReferrer = async (
  filter: ReferralLinkUsageSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredUsages = [...MOCK_LINK_USAGES];

    // Filter by linkId
    if (filter.linkId) {
      filteredUsages = filteredUsages.filter(
        (usage) => usage.linkId === filter.linkId,
      );
    }

    // Filter by programId
    if (filter.programId) {
      filteredUsages = filteredUsages.filter(
        (usage) => usage.programId === filter.programId,
      );
    }

    // Filter by statuses
    if (filter.statuses && filter.statuses.length > 0) {
      filteredUsages = filteredUsages.filter((usage) =>
        filter.statuses!.includes(usage.status),
      );
    }

    // Filter by date range
    if (filter.dateStart) {
      filteredUsages = filteredUsages.filter(
        (usage) => usage.dateClaimed >= filter.dateStart!,
      );
    }
    if (filter.dateEnd) {
      filteredUsages = filteredUsages.filter(
        (usage) => usage.dateClaimed <= filter.dateEnd!,
      );
    }

    const pageNumber = filter.pageNumber ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredUsages.slice(startIndex, endIndex);

    return {
      items,
      totalCount: filteredUsages.length,
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/referrer`,
    filter,
  );
  return data;
};

export const searchReferralLinkUsagesAsReferee = async (
  filter: ReferralLinkUsageSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Reuse the same mock data and filtering logic
    return searchReferralLinkUsagesAsReferrer(filter, context);
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/referee`,
    filter,
  );
  return data;
};

export const searchReferralLinkUsagesAdmin = async (
  filter: ReferralLinkUsageSearchFilterAdmin,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkUsageSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredUsages = [...MOCK_LINK_USAGES];

    //   // Filter by linkId
    //   if (filter.linkId) {
    //     filteredUsages = filteredUsages.filter(
    //       (usage) => usage.linkId === filter.linkId,
    //     );
    //   }

    //   // Filter by programId
    //   if (filter.programId) {
    //     filteredUsages = filteredUsages.filter(
    //       (usage) => usage.programId === filter.programId,
    //     );
    //   }

    //   // Filter by userIdReferee
    //   if (filter.userIdReferee) {
    //     filteredUsages = filteredUsages.filter(
    //       (usage) => usage.userId === filter.userIdReferee,
    //     );
    //   }

    //   // Filter by statuses
    //   if (filter.statuses && filter.statuses.length > 0) {
    //     filteredUsages = filteredUsages.filter((usage) =>
    //       filter.statuses!.includes(usage.status),
    //     );
    //   }

    //   // Filter by date range
    //   if (filter.dateStart) {
    //     filteredUsages = filteredUsages.filter(
    //       (usage) => usage.dateClaimed >= filter.dateStart!,
    //     );
    //   }
    //   if (filter.dateEnd) {
    //     filteredUsages = filteredUsages.filter(
    //       (usage) => usage.dateClaimed <= filter.dateEnd!,
    //     );
    //   }

    const pageNumber = filter.pageNumber ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredUsages.slice(startIndex, endIndex);

    return {
      items,
      totalCount: filteredUsages.length,
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkUsageSearchResults>(
    `/referral/link/usage/search/admin`,
    filter,
  );
  return data;
};

export const claimReferralLinkAsReferee = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const link = MOCK_REFERRAL_LINKS.find((l) => l.id === id);
    if (!link) {
      throw new Error(`Referral link with id ${id} not found`);
    }

    // Mock: Create a new usage record
    const newUsage: ReferralLinkUsageInfo = {
      id: `usage${MOCK_LINK_USAGES.length + 1}`,
      programId: link.programId,
      programName: "Program Name",
      linkId: link.id,
      linkName: link.name,
      // Referrer info (from link)
      userIdReferrer: link.userId,
      userDisplayNameReferrer: link.userDisplayName,
      userEmailReferrer: link.userEmail,
      userPhoneNumberReferrer: link.userPhoneNumber,
      // Referee info (current user)
      userId: "currentUser",
      userDisplayName: "Current User",
      userEmail: "user@example.com",
      userPhoneNumber: null,
      statusId: "1",
      status: ReferralLinkUsageStatus.Pending,
      dateClaimed: new Date().toISOString(),
      dateCompleted: null,
      dateExpired: null,
      proofOfPersonhoodCompleted: false,
      proofOfPersonhoodMethod: null,
      pathwayComplete: false,
      percentComplete: 0,
      pathway: null,
    };

    MOCK_LINK_USAGES.push(newUsage);
    return;
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.post(`/referral/link/${id}/claim`);
};

export const searchReferralLinksAdmin = async (
  filter: any,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ReferralLinkSearchResults> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredLinks = [...MOCK_REFERRAL_LINKS];

    //   // Filter by programId
    //   if (filter.programId) {
    //     filteredLinks = filteredLinks.filter(
    //       (link) => link.programId === filter.programId,
    //     );
    //   }

    //   // Filter by userId
    //   if (filter.userId) {
    //     filteredLinks = filteredLinks.filter(
    //       (link) => link.userId === filter.userId,
    //     );
    //   }

    //   // Filter by valueContains
    //   if (filter.valueContains) {
    //     const searchTerm = filter.valueContains.toLowerCase();
    //     filteredLinks = filteredLinks.filter(
    //       (link) =>
    //         link.name.toLowerCase().includes(searchTerm) ||
    //         link.description?.toLowerCase().includes(searchTerm),
    //     );
    //   }

    //   // Filter by statuses
    //   if (filter.statuses && filter.statuses.length > 0) {
    //     filteredLinks = filteredLinks.filter((link) =>
    //       filter.statuses!.includes(link.status),
    //     );
    //   }

    const pageNumber = filter.pageNumber ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredLinks.slice(startIndex, endIndex);

    return {
      items,
      totalCount: filteredLinks.length,
    };
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<ReferralLinkSearchResults>(
    `/referral/link/search/admin`,
    filter,
  );
  return data;
};

export const getBlockReasons = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<BlockReason[]> => {
  if (USE_MOCK_DATA) {
    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
      {
        id: "1",
        name: "Spam or fraudulent activity",
        description: "Please specify the reason",
      },
      {
        id: "2",
        name: "Violation of terms of service",
        description: "Please specify the reason",
      },
      {
        id: "3",
        name: "Abuse of referral system",
        description: "Please specify the reason",
      },
      {
        id: "4",
        name: "Inappropriate content sharing",
        description: "Please specify the reason",
      },
      {
        id: "5",
        name: "Multiple account violations",
        description: "Please specify the reason",
      },
      { id: "6", name: "Other", description: "Please specify the reason" },
    ];
  }

  // Real API call
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<BlockReason[]>("/referral/block/reason");
  return data;
};

export const blockReferrer = async (
  request: BlockRequest,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.put("/referral/block", request);
};

export const unblockReferrer = async (
  request: UnblockRequest,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.patch("/referral/unblock", request);
};
