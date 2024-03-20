using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.Reward.Services
{
    public class RewardBackgroundService : IRewardBackgrounService
    {
        #region Class Variables
        private readonly ILogger<SSIBackgroundService> _logger;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IWalletService _walletService;
        private readonly IRewardService _rewardService;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly IOpportunityService _opportunityService;
        private readonly IRewardProviderClient _rewardProviderClient;
        private readonly IExecutionStrategyService _executionStrategyService;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public RewardBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IWalletService walletService,
            IRewardService rewardService,
            IMyOpportunityService myOpportunityService,
            IOpportunityService opportunityService,
            IRewardProviderClientFactory rewardProviderClientFactory,
            IExecutionStrategyService executionStrategyService)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _walletService = walletService;
            _rewardService = rewardService;
            _myOpportunityService = myOpportunityService;
            _opportunityService = opportunityService;
            _rewardProviderClient = rewardProviderClientFactory.CreateClient();
            _executionStrategyService = executionStrategyService;
        }
        #endregion

        #region Public Members
        public void ProcessWalletCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing Reward wallet creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.RewardWalletCreationScheduleMaxIntervalInHours);

                var itemIdsToSkip = new List<Guid>();
                while (executeUntil > DateTime.Now)
                {
                    var items = _walletService.ListPendingCreationSchedule(_scheduleJobOptions.RewardWalletCreationScheduleBatchSize, itemIdsToSkip);
                    if (items.Count == 0) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing reward wallet creation for item with id '{id}'", item.Id);

                            _executionStrategyService.ExecuteInExecutionStrategy(() =>
                            {
                                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                                var wallet = _walletService.CreateWallet(item.UserId).Result;

                                item.WalletId = wallet.Id;
                                item.Balance = wallet.Balance; //track initial balance upon creation, if any
                                item.Status = WalletCreationStatus.Created;
                                _walletService.UpdateScheduleCreation(item).Wait();

                                scope.Complete();
                            });

                            _logger.LogInformation("Processed reward wallet creation for item with id '{id}'", item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to created reward wallet for item with id '{id}'", item.Id);

                            item.Status = WalletCreationStatus.Error;
                            item.ErrorReason = ex.Message;
                            _walletService.UpdateScheduleCreation(item).Wait();

                            itemIdsToSkip.Add(item.Id);
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed reward wallet creation");
            }
        }

        public void ProcessRewardTransactions()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing reward transactions");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.RewardTransactionScheduleMaxIntervalInHours);

                var itemIdsToSkip = new List<Guid>();
                while (executeUntil > DateTime.Now)
                {
                    var items = _rewardService.ListPendingTransactionSchedule(_scheduleJobOptions.RewardTransactionScheduleBatchSize, itemIdsToSkip);
                    if (items.Count == 0) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing reward transaction for item with id '{id}'", item.Id);

                            var (proceed, userEmail, walletId) = GetWalletId(item, item.UserId);
                            if (!proceed)
                            {
                                itemIdsToSkip.Add(item.Id);
                                continue;
                            }

                            var sourceEntityType = Enum.Parse<RewardTransactionEntityType>(item.SourceEntityType, false);

                            var request = new RewardAwardRequest
                            {
                                Type = sourceEntityType,
                                Username = userEmail,
                                UserWalletId = walletId,
                                Amount = item.Amount
                            };

                            switch (sourceEntityType)
                            {
                                case RewardTransactionEntityType.MyOpportunity:
                                    if (!item.MyOpportunityId.HasValue)
                                        throw new InvalidOperationException($"Source entity type '{item.SourceEntityType}': 'My' opportunity id is null");

                                    var myOpportunity = _myOpportunityService.GetById(item.MyOpportunityId.Value, false, false, false);
                                    var opportunity = _opportunityService.GetById(myOpportunity.OpportunityId, true, false, false);

                                    request.Id = myOpportunity.Id;
                                    request.Title = opportunity.Title;
                                    request.Description = opportunity.Description;
                                    request.Instructions = opportunity.Instructions;
                                    request.Skills = opportunity.Skills;
                                    request.Countries = opportunity.Countries;
                                    request.Languages = opportunity.Languages;
                                    request.TimeInvestedInHours = opportunity.TimeIntervalToHours();
                                    request.ExternalURL = opportunity.URL;
                                    request.StartDate = myOpportunity.DateStart;
                                    request.EndDate = myOpportunity.DateEnd;

                                    break;

                                default:
                                    throw new InvalidOperationException($"Source entity type of '{sourceEntityType}' not supported");
                            }

                            item.TransactionId = _rewardProviderClient.RewardEarn(request).Result;
                            item.Status = RewardTransactionStatus.Processed;
                            _rewardService.UpdateTransaction(item).Wait();

                            _logger.LogInformation("Processed reward transaction for item with id '{id}'", item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process reward transaction for item with id '{id}'", item.Id);

                            item.Status = RewardTransactionStatus.Error;
                            item.ErrorReason = ex.Message;
                            _rewardService.UpdateTransaction(item).Wait();

                            itemIdsToSkip.Add(item.Id);
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed reward transactions");
            }
        }
        #endregion

        #region Private Members
        private (bool proceed, string userEmail, string walletId) GetWalletId(RewardTransaction item, Guid userId)
        {
            var (userEmail, walletId) = _walletService.GetWalletIdOrNull(userId);
            if (string.IsNullOrEmpty(walletId))
            {
                _logger.LogInformation(
                    "Processing of reward transaction for item with id '{itemId}' " +
                    "was skipped as the wallet creation for user with id '{userId}' has not been completed", item.Id, userId);
                return (false, userEmail, string.Empty);
            }
            return (true, userEmail, walletId);
        }
        #endregion
    }
}
