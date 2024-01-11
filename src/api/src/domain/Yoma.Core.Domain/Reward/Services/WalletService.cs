using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.Reward.Validators;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.Reward.Services
{
    public class WalletService : IWalletService
    {
        #region Class Variables
        private readonly ILogger<SSITenantService> _logger;
        private readonly AppSettings _appSettings;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IRewardProviderClient _rewardProviderClient;
        private readonly IUserService _userService;
        private readonly IWalletCreationStatusService _walletCreationStatusService;
        private readonly IRepository<WalletCreation> _walletCreationRepository;
        private readonly WalletVoucherSearchFilterValidator _walletVoucherSearchFilterValidator;
        #endregion

        #region Constructor
        public WalletService(ILogger<SSITenantService> logger,
            IOptions<AppSettings> appSettings,
            IHttpContextAccessor httpContextAccessor,
            IRewardProviderClientFactory rewardProviderClientFactory,
            IUserService userService,
            IWalletCreationStatusService walletCreationStatusService,
            IRepository<WalletCreation> walletCreationRepository,
            WalletVoucherSearchFilterValidator walletVoucherSearchFilterValidator)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _rewardProviderClient = rewardProviderClientFactory.CreateClient();
            _appSettings = appSettings.Value;
            _userService = userService;
            _walletCreationStatusService = walletCreationStatusService;
            _walletCreationRepository = walletCreationRepository;
            _walletVoucherSearchFilterValidator = walletVoucherSearchFilterValidator;
        }
        #endregion

        #region Public Members
        public string GetWalletId(Guid userId)
        {
            var result = GetWalletIdOrNull(userId);
            if (string.IsNullOrEmpty(result))
                throw new EntityNotFoundException($"Wallet id not found for user with id '{userId}'");
            return result;
        }

        public string? GetWalletIdOrNull(Guid userId)
        {
            var user = _userService.GetById(userId, false, false);

            var statusCreatedId = _walletCreationStatusService.GetByName(WalletCreationStatus.Created.ToString()).Id;

            var result = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.StatusId == statusCreatedId);

            if (result != null && string.IsNullOrEmpty(result.WalletId))
                throw new DataInconsistencyException($"Wallet id expected with wallet creation status of '{WalletCreationStatus.Created}' for item with id '{result.Id}'");

            return result?.WalletId;
        }

        public async Task<(WalletCreationStatus status, WalletBalance balance)> GetWalletStatusAndBalance(Guid userId)
        {
            var user = _userService.GetById(userId, false, false);
            var item = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id);

            var status = item?.Status ?? WalletCreationStatus.Unscheduled;

            var balance = new WalletBalance { Pending = default }; //TODO: query pending awards and calculate balance

            switch (status)
            {
                case WalletCreationStatus.Unscheduled:
                case WalletCreationStatus.Pending:
                case WalletCreationStatus.Error:
                    break;
                case WalletCreationStatus.Created:
                    if (item == null)
                        throw new InvalidOperationException($"Wallet creation item excepted with status '{status}'");

                    if (string.IsNullOrEmpty(item.WalletId))
                        throw new DataInconsistencyException($"Wallet id expected with wallet creation status of 'Created' for item with id '{item.Id}'");
                    var wallet = await _rewardProviderClient.GetWallet(item.WalletId);

                    balance.Available = wallet.Balance;
                    break;
                default:
                    throw new InvalidOperationException($"Status of '{status}' not supported");
            }

            balance.Total = balance.Pending + balance.Available;
            return (status, balance);
        }

        public async Task<WalletVoucherSearchResults> SearchVouchers(WalletVoucherSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            await _walletVoucherSearchFilterValidator.ValidateAndThrowAsync(filter);

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            var item = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == user.Id) ?? throw new ValidationException($"Wallet creation for the user with email '{user.Email}' hasn't been scheduled. Kindly log out and log back in");

            if (item.Status != WalletCreationStatus.Created)
                throw new ValidationException($"The wallet creation for the user with email '{user.Email}' is currently pending. Please try again later or contact technical support for assistance");

            if (string.IsNullOrEmpty(item.WalletId))
                throw new DataInconsistencyException($"Wallet id expected with wallet creation status of 'Created' for item with id '{item.Id}'");

            var offset = default(int?);
            if (filter.PaginationEnabled)
                offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

            var result = new WalletVoucherSearchResults
            { Items = await _rewardProviderClient.ListWalletVouchers(item.WalletId, filter.PageSize, offset) };

            return result;
        }

        public async Task<Wallet> CreateWallet(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentNullException(nameof(userId));

            var user = _userService.GetById(userId, false, false);

            //query pending awards and calculate balance
            decimal? balance = null;

            //attempt wallet creation
            var request = new WalletRequestCreate
            {
                Email = user.Email,
                DisplayName = user.DisplayName,
                Balance = balance
            };

            var response = await _rewardProviderClient.CreateWallet(request);

            switch (response.status)
            {
                case Models.Provider.WalletCreationStatus.Existing:
                    break;

                case Models.Provider.WalletCreationStatus.CreatedWithBalance:
                    //TODO: flag pending awards as processed
                    break;

                case Models.Provider.WalletCreationStatus.Created:
                    break;

                default:
                    throw new InvalidOperationException($"Status of '{response.status}' not supported");
            }

            return response.wallet;
        }

        public async Task CreateWalletOrScheduleCreation(Guid? userId)
        {
            if (!userId.HasValue || userId.Value == Guid.Empty)
                throw new ArgumentNullException(nameof(userId));

            var existingItem = _walletCreationRepository.Query().SingleOrDefault(o => o.UserId == userId.Value);
            if (existingItem != null)
            {
                _logger.LogInformation("Wallet creation skipped: Already '{status}' for user with id '{userId}'", existingItem.Status, userId.Value);
                return;
            }

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            var item = new WalletCreation { UserId = userId.Value };
            try
            {
                var wallet = await CreateWallet(userId.Value);
                item.WalletId = wallet.Id;
                item.StatusId = _walletCreationStatusService.GetByName(TenantCreationStatus.Created.ToString()).Id;
            }
            catch (Exception)
            {
                //schedule creation for delayed execution
                item.StatusId = _walletCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;
            }

            await _walletCreationRepository.Create(item);

            scope.Complete();
        }

        public List<WalletCreation> ListPendingCreationSchedule(int batchSize)
        {
            var statusPendingId = _walletCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;

            var results = _walletCreationRepository.Query().Where(o => o.StatusId == statusPendingId).OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task UpdateScheduleCreation(WalletCreation item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.WalletId = item.WalletId?.Trim();

            var statusId = _walletCreationStatusService.GetByName(item.Status.ToString()).Id;
            item.StatusId = statusId;

            switch (item.Status)
            {
                case WalletCreationStatus.Created:
                    if (string.IsNullOrEmpty(item.WalletId))
                        throw new ArgumentNullException(nameof(item), "Wallet id required");
                    item.ErrorReason = null;
                    item.RetryCount = null;
                    break;

                case WalletCreationStatus.Error:
                    if (string.IsNullOrEmpty(item.ErrorReason))
                        throw new ArgumentNullException(nameof(item), "Error reason required");

                    item.ErrorReason = item.ErrorReason?.Trim();
                    item.RetryCount = (byte?)(item.RetryCount + 1) ?? 1;
                    if (item.RetryCount == _appSettings.RewardMaximumRetryAttempts) break; //max retry count reached
                    item.StatusId = _walletCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;
                    break;

                default:
                    throw new InvalidOperationException($"Status of '{item.Status}' not supported");
            }

            await _walletCreationRepository.Update(item);
        }
        #endregion
    }
}
