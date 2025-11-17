using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public class BlockService : IBlockService
  {
    #region Class Variables
    private readonly ILogger<BlockService> _logger;

    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IUserService _userService;
    private readonly IBlockReasonService _blockReasonService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;
    private readonly INotificationDeliveryService _notificationDeliveryService;

    private readonly BlockRequestValidator _blockRequestValidator;
    private readonly UnblockRequestValidator _unblockRequestValidator;

    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepository<Block> _blockRepository;
    #endregion

    #region Constructor
    public BlockService(
      ILogger<BlockService> logger,

      IHttpContextAccessor httpContextAccessor,

      IUserService userService,
      IBlockReasonService blockReasonService,
      ILinkMaintenanceService linkMaintenanceService,
      INotificationDeliveryService notificationDeliveryService,

      IExecutionStrategyService executionStrategyService,

      BlockRequestValidator blockRequestValidator,
      UnblockRequestValidator unblockRequestValidator,

      IRepository<Block> blockRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));

      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _blockReasonService = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));
      _notificationDeliveryService = notificationDeliveryService ?? throw new ArgumentNullException(nameof(notificationDeliveryService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _blockRequestValidator = blockRequestValidator ?? throw new ArgumentNullException(nameof(blockRequestValidator));
      _unblockRequestValidator = unblockRequestValidator ?? throw new ArgumentNullException(nameof(unblockRequestValidator));

      _blockRepository = blockRepository ?? throw new ArgumentNullException(nameof(blockRepository));
    }
    #endregion

    #region Public Members
    public Block? GetByUserIdOrNull(Guid userId)
    {
      var user = _userService.GetById(userId, false, false);
      var result = _blockRepository.Query().Where(o => o.UserId == user.Id && o.Active).SingleOrDefault();
      return result;
    }

    public async Task<Block> Block(BlockRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      _blockRequestValidator.ValidateAndThrow(request);

      var user = _userService.GetById(request.UserId, false, false);

      var existing = _blockRepository.Query().Where(o => o.UserId == user.Id && o.Active).SingleOrDefault();
      if (existing != null) return existing; //user is already blocked

      var reason = _blockReasonService.GetById(request.ReasonId);

      var userActor = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      Block? result = null;
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        result = new Block()
        {
          UserId = user.Id,
          ReasonId = request.ReasonId,
          Reason = reason.Name,
          ReasonDescription = reason.Description,
          CommentBlock = request.Comment,
          Active = true,
          CreatedByUserId = userActor.Id,
          ModifiedByUserId = userActor.Id
        };

        await _blockRepository.Create(result);

        if (request.CancelLinks == true) await _linkMaintenanceService.CancelByUserId(user.Id);

        scope.Complete();
      });

      if (result == null)
        throw new InvalidOperationException("Block operation failed. Result expected but null");

      await SendNotification(NotificationType.Referral_Blocked_Referrer, user, result);

      return result;
    }

    public async Task Unblock(UnblockRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _unblockRequestValidator.ValidateAndThrowAsync(request);

      var user = _userService.GetById(request.UserId, false, false);

      var result = _blockRepository.Query().Where(o => o.UserId == user.Id && o.Active).SingleOrDefault();
      if (result == null) return; //user is not blocked

      var userActor = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      result.Active = false;
      result.CommentUnBlock = request.Comment;
      result.ModifiedByUserId = userActor.Id;

      await _blockRepository.Update(result);

      await SendNotification(NotificationType.Referral_Unblocked_Referrer, user, result);
    }
    #endregion

    #region Private Members
    private async Task SendNotification(NotificationType type, Domain.Entity.Models.User user, Block block)
    {
      try
      {
        List<NotificationRecipient>? recipients = null;

        recipients = type switch
        {
          NotificationType.Referral_Blocked_Referrer or
          NotificationType.Referral_Unblocked_Referrer =>
              [new() { Username = user.Username, PhoneNumber = user.PhoneNumber, PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                Email = user.Email, EmailConfirmed = user.EmailConfirmed, DisplayName = user.DisplayName }],

          _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
        };

        var data = new NotificationReferralBlock
        {
          DateStamp = DateTimeOffset.UtcNow,
          Reason = $"{block.Reason}: {block.ReasonDescription}",
          Comment = block.CommentBlock
        };

        await _notificationDeliveryService.Send(type, recipients, data);

        _logger.LogInformation("Successfully sent notification");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
      }
    }
    #endregion
  }
}
