using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using Yoma.Core.Api.Common;

namespace Yoma.Core.Api.Attributes
{
  [AttributeUsage(validOn: AttributeTargets.Class | AttributeTargets.Method)]
  public class ApiKeyAttribute : Attribute, IAsyncActionFilter
  {
    #region Class Variables
    #endregion

    #region Constructor
    public ApiKeyAttribute() { }
    #endregion

    #region Public Members
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
      if (!context.HttpContext.Request.Headers.TryGetValue(Constants.RequestHeader_ApiKey, out var _))
      {
        context.Result = new ContentResult()
        {
          StatusCode = (int)HttpStatusCode.Unauthorized,
          Content = HttpStatusCode.Unauthorized.ToString()
        };
        return;
      }

      //validate extractedApiKey key against configuration / storage
      //StatusCode = (int)HttpStatusCode.Unauthorized,
      //Content = HttpStatusCode.Unauthorized.ToString()

      await next();
    }
    #endregion
  }
}
