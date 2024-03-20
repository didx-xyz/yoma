using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public class OpportunityBackgroundService : IOpportunityBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IOpportunityStatusService _opportunityStatusService;
    private readonly IOrganizationService _organizationService;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IUserService _userService;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
    private static readonly Status[] Statuses_Expirable = [Status.Active, Status.Inactive];
    private static readonly Status[] Statuses_Deletion = [Status.Inactive, Status.Expired];

    private static readonly object _lock_Object = new();
    #endregion

    #region Constructor
    public OpportunityBackgroundService(ILogger<OpportunityBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IOpportunityStatusService opportunityStatusService,
        IOrganizationService organizationService,
        IEmailProviderClientFactory emailProviderClientFactory,
        IUserService userService,
        IEmailURLFactory emailURLFactory,
        IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> opportunityRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _opportunityStatusService = opportunityStatusService;
      _organizationService = organizationService;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _userService = userService;
      _emailURLFactory = emailURLFactory;
      _opportunityRepository = opportunityRepository;
    }
    #endregion

    #region Public Members
    public void ProcessExpiration()
    {
      lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
      {
        _logger.LogInformation("Processing opportunity expiration");

        var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

        do
        {
          var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
              o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusExpiredId;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Opportunity with id '{id}' flagged for expiration", item.Id);
          }

          items = _opportunityRepository.Update(items).Result;

          SendEmail(items, EmailType.Opportunity_Expiration_Expired).Wait();

        } while (true);

        _logger.LogInformation("Processed opportunity expiration");
      }
    }

    public void ProcessExpirationNotifications()
    {
      lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
      {
        _logger.LogInformation("Processing opportunity expiration notifications");

        var datetimeFrom = new DateTimeOffset(DateTime.Today).ToUniversalTime();
        var datetimeTo = datetimeFrom.AddDays(_scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays);
        var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

        var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
            o.DateEnd.HasValue && o.DateEnd.Value >= datetimeFrom && o.DateEnd.Value <= datetimeTo)
            .OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
        if (items.Count == 0) return;

        SendEmail(items, EmailType.Opportunity_Expiration_WithinNextDays).Wait();

        _logger.LogInformation("Processed opportunity expiration notifications");
      }
    }

    public void ProcessDeletion()
    {
      lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
      {
        _logger.LogInformation("Processing opportunity deletion");

        var statusDeletionIds = Statuses_Deletion.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
        var statusDeletedId = _opportunityStatusService.GetByName(Status.Deleted.ToString()).Id;

        do
        {
          var items = _opportunityRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OpportunityDeletionIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusDeletedId;
            item.ModifiedByUserId = user.Id;
            _logger.LogInformation("Opportunity with id '{id}' flagged for deletion", item.Id);
          }

          _opportunityRepository.Update(items).Wait();

        } while (true);
      }
    }
    #endregion

    #region Private Members
    private async Task SendEmail(List<Models.Opportunity> items, EmailType type)
    {
      var groupedOpportunities = items
          .SelectMany(op => _organizationService.ListAdmins(op.OrganizationId, false, false), (op, admin) => new { Administrator = admin, Opportunity = op })
          .GroupBy(item => item.Administrator, item => item.Opportunity);

      foreach (var group in groupedOpportunities)
      {
        try
        {
          var recipients = new List<EmailRecipient>
                        {
                            new() { Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

          var data = new EmailOpportunityExpiration
          {
            WithinNextDays = _scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays,
            Opportunities = []
          };

          foreach (var op in group)
          {
            data.Opportunities.Add(new EmailOpportunityExpirationItem
            {
              Title = op.Title,
              DateStart = op.DateStart,
              DateEnd = op.DateEnd,
              URL = _emailURLFactory.OpportunityExpirationItemURL(type, op.Id, op.OrganizationId)
            });
          }

          await _emailProviderClient.Send(type, recipients, data);

          _logger.LogInformation("Successfully send '{emailType}' email", type);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to send '{emailType}' email", type);
        }
      }
    }
    #endregion
  }
}
