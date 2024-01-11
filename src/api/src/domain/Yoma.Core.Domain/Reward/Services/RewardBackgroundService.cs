using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;
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

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public RewardBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IWalletService walletService)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _walletService = walletService;
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

                            var wallet = _walletService.CreateWallet(item.UserId).Result;

                            item.WalletId = wallet.Id;
                            item.Status = WalletCreationStatus.Created;
                            _walletService.UpdateScheduleCreation(item).Wait();

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
        #endregion  
    }
}
