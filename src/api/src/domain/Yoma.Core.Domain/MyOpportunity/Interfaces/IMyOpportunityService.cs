using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
  public interface IMyOpportunityService
  {
    Models.MyOpportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    MyOpportunityResponseVerifyStatus GetVerificationStatus(Guid opportunityId);

    MyOpportunityResponseVerifyCompletedExternal GetVerificationCompletedExternal(Guid opportunityId);

    Task ScheduleDownloadVerificationFiles(MyOpportunitySearchFilterVerificationFiles filter, bool ensureOrganizationAuthorization);

    Task<IFormFile> DownloadVerificationFiles(MyOpportunitySearchFilterVerificationFiles filter);

    Task<List<IFormFile>> DownloadVerificationFiles(MyOpportunitySearchFilterVerificationFiles filter, Guid? userId);

    List<MyOpportunitySearchCriteriaOpportunity> ListMyOpportunityVerificationSearchCriteriaOpportunity(List<Guid>? organizations, List<VerificationStatus>? verificationStatuses, bool ensureOrganizationAuthorization);

    MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter, User? user);

    TimeIntervalSummary GetSummary();

    MyOpportunitySearchResults Search(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    (string fileName, byte[] bytes) ExportToCSV(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization, bool appendDateStamp);

    Task<(bool scheduleForProcessing, string? fileName, byte[]? bytes)> ScheduleOrExportToCSV(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    Task PerformActionViewed(Guid opportunityId);

    Task PerformActionSaved(Guid opportunityId);

    Task PerformActionNavigatedExternalLink(Guid opportunityId);

    bool ActionedSaved(Guid opportunityId);

    Task PerformActionSavedRemove(Guid opportunityId);

    Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request);

    Task PerformActionSendForVerificationManual(Guid userId, Guid opportunityId, MyOpportunityRequestVerify request, bool overridePending);

    Task PerformActionSendForVerificationManualDelete(Guid opportunityId);

    Task<MyOpportunityResponseVerifyFinalizeBatch> FinalizeVerificationManual(MyOpportunityRequestVerifyFinalizeBatch request);

    Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request);

    Dictionary<Guid, int>? ListAggregatedOpportunityByViewed(bool includeExpired);

    Dictionary<Guid, int>? ListAggregatedOpportunityByCompleted(bool includeExpired);

    Task PerformActionInstantVerification(Guid linkId);

    Task PerformActionImportVerificationFromCSV(MyOpportunityRequestVerifyImportCsv request, bool ensureOrganizationAuthorization);
  }
}
