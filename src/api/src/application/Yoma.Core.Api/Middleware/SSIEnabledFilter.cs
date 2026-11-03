using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using System.Net;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
  /// <summary>
  /// Applies the existing SSI environment setting to API requests before controller activation.
  /// Disabled environments must not invoke wallet or schema operations against the provider.
  /// </summary>
  public class SSIEnabledFilter : IAsyncResourceFilter
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    #endregion

    #region Constructor
    public SSIEnabledFilter(IOptions<AppSettings> appSettings, IEnvironmentProvider environmentProvider)
    {
      ArgumentNullException.ThrowIfNull(appSettings, nameof(appSettings));

      _appSettings = appSettings.Value;
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
    }
    #endregion

    #region Public Members
    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
      if (!_appSettings.SSIEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        context.Result = new ObjectResult(new List<ErrorResponseItem>
        {
          new()
          {
            Type = nameof(HttpStatusCode.ServiceUnavailable),
            Message = "SSI is disabled for this environment"
          }
        })
        {
          StatusCode = (int)HttpStatusCode.ServiceUnavailable
        };
        return;
      }

      await next();
    }
    #endregion
  }
}
