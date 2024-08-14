using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Extensions
{
  public static class ResponseExtensions
  {
    /// <summary>
    /// Ensures that the response indicates success. If not, it throws an exception
    /// After a successful invocation, the <see cref="OpportunityUpsertResponse.Details"/> property will not be null
    /// </summary>
    /// <param name="response">The response to check</param>
    /// <exception cref="HttpClientException">Thrown if the response indicates failure or has missing/invalid details</exception>
    public static void EnsureSuccess(this OpportunityUpsertResponse response)
    {
      ArgumentNullException.ThrowIfNull(response, nameof(response));

      if (response.Success)
      {
        if (response.Details == null || response.Details.OpportunityId <= default(int))
          throw new HttpClientException(HttpStatusCode.BadRequest, "Opportunity creation succeeded but details are missing or invalid");
        return;
      }

      var errorMessage = response.Errors == null ? null : string.Join("; ", response.Errors.Where(error => !string.IsNullOrWhiteSpace(error)));
      if (string.IsNullOrEmpty(errorMessage))
        errorMessage = "An unknown error occurred";

      throw new HttpClientException(HttpStatusCode.BadRequest, errorMessage);
    }
  }
}
