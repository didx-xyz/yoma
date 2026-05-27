using Flurl;
using Flurl.Http;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class FlurlExtensions
  {
    #region Class Variables
    private const string Error_ResponseEmpty = "Response is empty / null";
    #endregion

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
      HttpStatusCode statusCode;
      string responseContent;

      var successStatusCodes = AdditionalSuccessStatusCodes?.ToList() ?? [];
      if (!successStatusCodes.Contains(HttpStatusCode.OK)) successStatusCodes.Add(HttpStatusCode.OK);

      try
      {
        resp = await response;
      }
      catch (FlurlHttpException ex)
      {
        if (ex.Call == null || ex.Call.Response == null)
          throw new HttpClientException(HttpStatusCode.InternalServerError, $"{Error_ResponseEmpty}: {ex.Message}");

        resp = ex.Call.Response;
        statusCode = (HttpStatusCode)resp.StatusCode;
        if (successStatusCodes.Contains(statusCode)) return resp;

        responseContent = await GetResponseContent(resp, ex.Message);
        throw new HttpClientException(statusCode, responseContent);
      }
      catch (Exception ex)
      {
        throw new HttpClientException(HttpStatusCode.InternalServerError, ex.Message);
      }

      statusCode = (HttpStatusCode)resp.StatusCode;
      if (successStatusCodes.Contains(statusCode)) return resp;

      responseContent = await GetResponseContent(resp);
      throw new HttpClientException(statusCode, responseContent);
    }

    private static async Task<string> GetResponseContent(IFlurlResponse response, string? fallbackMessage = null)
    {
      var responseContent = await response.ResponseMessage.Content.ReadAsStringAsync();

      if (!string.IsNullOrWhiteSpace(responseContent))
        return responseContent;

      responseContent = response.ResponseMessage.ReasonPhrase;

      if (!string.IsNullOrWhiteSpace(responseContent))
        return responseContent;

      fallbackMessage = fallbackMessage?.Trim();

      return string.IsNullOrWhiteSpace(fallbackMessage) ? Error_ResponseEmpty : $"{Error_ResponseEmpty}: {fallbackMessage}";
    }
    #endregion
  }
}
