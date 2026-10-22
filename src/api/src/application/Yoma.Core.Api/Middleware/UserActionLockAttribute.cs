using Microsoft.AspNetCore.Mvc;

namespace Yoma.Core.Api.Middleware
{
  /// <summary>
  /// Serializes selected youth API mutations per authenticated Yoma user and controller action.
  /// An optional scope groups related actions within the same controller under one lock.
  /// Null, empty or whitespace scopes use the default action key; other scopes are trimmed.
  /// Domain state checks still determine whether the action may be performed again.
  /// </summary>
  [AttributeUsage(AttributeTargets.Method)]
  public sealed class UserActionLockAttribute : TypeFilterAttribute
  {
    public string? Scope { get; }

    public UserActionLockAttribute(string? scope = null) : base(typeof(UserActionLockFilter))
    {
      Scope = string.IsNullOrWhiteSpace(scope) ? null : scope.Trim();
    }
  }
}
