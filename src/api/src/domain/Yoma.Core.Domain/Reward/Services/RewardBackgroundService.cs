using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
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

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public RewardBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IWalletService walletService,
            IRewardService rewardService,
            IMyOpportunityService myOpportunityService)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _walletService = walletService;
            _rewardService = rewardService;
            _myOpportunityService = myOpportunityService;
        }
        #endregion

        #region Public Members
        public void ProcessWalletCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing Reward wallet creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.RewardWalletCreationScheduleMaxIntervalInHours);

                while (executeUntil > DateTime.Now)
                {
                    var items = _walletService.ListPendingCreationSchedule(_scheduleJobOptions.RewardWalletCreationScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing reward wallet creation for item with id '{id}'", item.Id);

                            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                            var wallet = _walletService.CreateWallet(item.UserId).Result;

                            item.WalletId = wallet.Id;
                            item.Balance = wallet.Balance; //track initial balance upon creation, if any
                            item.Status = WalletCreationStatus.Created;
                            _walletService.UpdateScheduleCreation(item).Wait();

                            scope.Complete();

                            _logger.LogInformation("Processed reward wallet creation for item with id '{id}'", item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to created reward wallet for item with id '{id}'", item.Id);

                            item.Status = WalletCreationStatus.Error;
                            item.ErrorReason = ex.Message;
                            _walletService.UpdateScheduleCreation(item).Wait();
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

                while (executeUntil > DateTime.Now)
                {
                    var items = _rewardService.ListPendingTransactionSchedule(_scheduleJobOptions.RewardTransactionScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing reward transaction for item with id '{id}'", item.Id);

                            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                            var sourceEntityType = Enum.Parse<RewardTransactionEntityType>(item.SourceEntityType, false);
                            switch (sourceEntityType)
                            {
                                case RewardTransactionEntityType.MyOpportunity:
                                    if (!item.MyOpportunityId.HasValue)
                                        throw new InvalidOperationException($"Source entity type '{item.SourceEntityType}': 'My' opportunity id is null");

                                    var myOpportunity = _myOpportunityService.GetById(item.MyOpportunityId.Value,false, false, false);

                                    //TODO: process reward provider transaction

                                    break;

                                default:
                                    throw new InvalidOperationException($"Source entity type of '{sourceEntityType}' not supported");
                            }

                            item.TransactionId = "TODO";
                            item.Status = RewardTransactionStatus.Processed;
                            _rewardService.UpdateTransaction(item).Wait();

                            scope.Complete();

                            _logger.LogInformation("Processed reward transaction for item with id '{id}'", item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process reward transaction for item with id '{id}'", item.Id);

                            item.Status = RewardTransactionStatus.Error;
                            item.ErrorReason = ex.Message;
                            _rewardService.UpdateTransaction(item).Wait();
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed reward transactions");
            }
        }
        #endregion  
    }
}
