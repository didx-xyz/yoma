using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Services
{
  public class HolderContextService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IssuerClient _issuerClient;
    #endregion

    #region Constructor
    public HolderContextService(
      IHttpContextAccessor httpContextAccessor,
      IssuerClient issuerClient)
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
      _issuerClient = issuerClient ?? throw new ArgumentNullException(nameof(issuerClient));
    }
    #endregion

    #region Public Members
    public async Task<HolderContext> Get(string tenantId)
    {
      var context = _httpContextAccessor.HttpContext;
      if (context?.User.Identity?.IsAuthenticated != true)
        throw new UnauthorizedAccessException("An authenticated Yoma participant is required for wallet access");

      var subject = context.User.FindFirstValue("sub") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!Guid.TryParse(subject, out var subjectId) || !Guid.TryParse(tenantId, out var holderId))
        throw new UnauthorizedAccessException("The requested wallet does not belong to the authenticated participant");

      var authorization = context.Request.Headers.Authorization.ToString();
      if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        throw new UnauthorizedAccessException("A Yoma bearer token is required for federation");

      var holder = await _issuerClient.GetHolderOrNull(subjectId.ToString())
        ?? throw new InvalidOperationException("The participant has not been onboarded into didx:me");
      if (Guid.Parse(holder.Id) != holderId)
        throw new UnauthorizedAccessException("The requested wallet does not belong to the authenticated participant");

      return new HolderContext
      {
        AccessToken = authorization[7..].Trim(),
        UserId = subject!,
        HolderId = holderId.ToString()
      };
    }
    #endregion
  }
}
