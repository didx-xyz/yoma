using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public class BlockService : IBlockService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IUserService _userService;
    private readonly IBlockReasonService _blockReasonService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;

    private readonly BlockRequestValidator _blockRequestValidator;
    private readonly UnblockRequestValidator _unblockRequestValidator;

    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly IRepository<Block> _blockRepository;
    #endregion

    #region Constructor
    public BlockService(
      IHttpContextAccessor httpContextAccessor,

      IUserService userService,
      IBlockReasonService blockReasonService,
      ILinkMaintenanceService linkMaintenanceService,

      IExecutionStrategyService executionStrategyService,

      BlockRequestValidator blockRequestValidator,
      UnblockRequestValidator unblockRequestValidator,

      IRepository<Block> blockRepository)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _blockReasonService = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _blockRequestValidator = blockRequestValidator ?? throw new ArgumentNullException(nameof(blockRequestValidator));
      _unblockRequestValidator = unblockRequestValidator ?? throw new ArgumentNullException(nameof(unblockRequestValidator));

      _blockRepository = blockRepository ?? throw new ArgumentNullException(nameof(blockRepository));
    }
    #endregion

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
    }
  }
}
