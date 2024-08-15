using Flurl;
using Flurl.Http;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class FlurlExtensions
  {
    #region Public Members
    /// <summary>
    /// Creates a new FlurlRequest and sets the authorization header.
    /// </summary>
    /// <param name="url">This Flurl.Url.</param>
    /// <param name="name">The header name.</param>
    /// <param name="value">The header value.</param>
    /// <returns>A new IFlurlRequest.</returns>
    public static IFlurlRequest WithAuthHeader(this Url url, KeyValuePair<string, string> authHeader)
    {
      return new FlurlRequest(url).WithHeader(authHeader.Key, authHeader.Value);
    }

    /// <summary>
    /// Creates a new FlurlRequest and sets the authorization headers.
    /// </summary>
    /// <param name="url"></param>
    /// <param name="authHeaders"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public static IFlurlRequest WithAuthHeaders(this Url url, Dictionary<string, string> authHeaders)
    {
      if (authHeaders == null || authHeaders.Count == 0)
        throw new ArgumentNullException(nameof(authHeaders));

      return new FlurlRequest(url).WithHeaders(authHeaders);
    }

    /// <summary>
    /// Throws an exception if the Flurl response was not successful.
    /// </summary>
    /// <param name="response"></param>
    /// <returns></returns>
    public static async Task<IFlurlResponse> EnsureSuccessStatusCodeAsync(this Task<IFlurlResponse> response, List<HttpStatusCode>? AdditionalSuccessStatusCodes = null)
    {
      IFlurlResponse resp;

      try
      {
        resp = await response;
      }
      catch (FlurlHttpException ex)
      {
        if (ex.Call == null || ex.Call.Response == null)
          throw new HttpClientException(HttpStatusCode.InternalServerError, $"Response is empty / null: {ex.Message}");

        resp = ex.Call.Response;
        var errorMessage = await resp.ResponseMessage.Content.ReadAsStringAsync();
        if (string.IsNullOrEmpty(errorMessage)) errorMessage = resp.ResponseMessage.ReasonPhrase;
        if (string.IsNullOrEmpty(errorMessage))
          errorMessage = $"Response is empty / null: {ex.Message}";

        throw new HttpClientException((HttpStatusCode)resp.StatusCode, errorMessage);
      }
      catch (Exception ex)
      {
        throw new HttpClientException(HttpStatusCode.InternalServerError, ex.Message);
      }

      var statusCode = (HttpStatusCode)resp.StatusCode;
      var message = await resp.ResponseMessage.Content.ReadAsStringAsync();

      var successStatusCodes = AdditionalSuccessStatusCodes ?? [];
      if (!successStatusCodes.Contains(HttpStatusCode.OK)) successStatusCodes.Add(HttpStatusCode.OK);
      if (successStatusCodes.Contains(statusCode)) return resp;

      throw new HttpClientException(statusCode, message);
    }
    #endregion
  }
}
