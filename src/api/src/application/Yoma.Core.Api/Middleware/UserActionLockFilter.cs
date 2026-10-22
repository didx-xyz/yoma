using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using System.Reflection;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Api.Middleware
{
  /// <summary>
  /// Holds a per-user lock for a controller action or explicit shared scope before reading/changing persisted state.
  /// This is opt-in request serialization, not response caching or a replacement for database constraints.
  /// </summary>
  public sealed class UserActionLockFilter : IAsyncActionFilter
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly TimeSpan _acquireTimeout;
    private readonly TimeSpan _lockDuration;
    #endregion

    #region Constructor
    public UserActionLockFilter(
      IOptions<AppSettings> appSettings,
      IHttpContextAccessor httpContextAccessor,
      IUserService userService,
      IDistributedLockService distributedLockService)
    {
      var settings = appSettings?.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));

      if (settings.DistributedLockUserActionAcquireTimeoutInMilliseconds < 0)
        throw new InvalidOperationException($"{nameof(AppSettings)}:{nameof(AppSettings.DistributedLockUserActionAcquireTimeoutInMilliseconds)} must not be negative.");

      if (settings.DistributedLockUserActionLeaseDurationInSeconds <= 0)
        throw new InvalidOperationException($"{nameof(AppSettings)}:{nameof(AppSettings.DistributedLockUserActionLeaseDurationInSeconds)} must be greater than zero.");

      _acquireTimeout = TimeSpan.FromMilliseconds(settings.DistributedLockUserActionAcquireTimeoutInMilliseconds);

      // Use the full configured lease unchanged. Normal completion releases it immediately.
      _lockDuration = TimeSpan.FromSeconds(settings.DistributedLockUserActionLeaseDurationInSeconds);
    }
    #endregion

    #region Public Members
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
      context.HttpContext.RequestAborted.ThrowIfCancellationRequested();

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var action = context.ActionDescriptor as ControllerActionDescriptor
        ?? throw new InvalidOperationException($"{nameof(UserActionLockAttribute)} requires a controller action");

      // MVC supplies stable method metadata; include the signature to distinguish overloads.
      var scope = action.MethodInfo.GetCustomAttribute<UserActionLockAttribute>()?.Scope;
      var actionKey = scope == null ? action.MethodInfo.ToString() : $"scope:{scope}";
      var lockKey = $"api_user_action:{user.Id}:{action.ControllerTypeInfo.FullName}:{actionKey}";

      var executed = await _distributedLockService.TryRunWithLockAsync(lockKey, _lockDuration, _acquireTimeout, async () =>
      {
        // The request may have disconnected while waiting. Never start its action after that.
        context.HttpContext.RequestAborted.ThrowIfCancellationRequested();

        await next();
      }, context.HttpContext.RequestAborted);

      if (!executed)
        throw new RequestInProgressException("We're still working on your previous request. Just a moment, please.");
    }
    #endregion
  }
}
