using FluentValidation;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Services
{
  public class BlockService : IBlockService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly IProgramService _programService;
    private readonly IBlockReasonService _blockReasonService;

    private readonly IRepository<Block> _blockRepository;
    #endregion

    #region Constructor
    public BlockService(
      IHttpContextAccessor httpContextAccessor,
      IUserService userService,
      IProgramService programService,
      IBlockReasonService blockReasonService,
      IRepository<Block> blockRepository)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _blockReasonService = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));
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

      //TODO: Validator
      //TODO: Optionally cancel links

      var user = _userService.GetById(request.UserId, false, false);

      var result = _blockRepository.Query().Where(o => o.UserId == user.Id && o.Active).SingleOrDefault();
      if (result != null) throw new ValidationException($"User '{user.DisplayName}' is already blocked");

      var reason = _blockReasonService.GetById(request.ReasonId);

      var userActor = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

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

      return result;
    }

    public async Task<Block> Unblock(UnblockRequest request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      //TODO Validator

      var user = _userService.GetById(request.UserId, false, false);

      var result = _blockRepository.Query().Where(o => o.UserId == user.Id && o.Active).SingleOrDefault()
        ?? throw new ValidationException($"User '{user.DisplayName}' is not blocked");

      var userActor = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      result.Active = false;
      result.CommentUnBlock = request.Comment;
      result.ModifiedByUserId = userActor.Id;

      await _blockRepository.Update(result);

      return result;
    }
  }
}
