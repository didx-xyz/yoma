using Flurl.Http;
using Newtonsoft.Json;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Chimoney.Models;

namespace Yoma.Core.Infrastructure.Chimoney.Extensions
{
  internal static class ChimoneyFlurlExtensions
  {
    internal static async Task<IFlurlResponse> EnsureSuccessStatusCodeChimoneyAsync(this Task<IFlurlResponse> response)
    {
      try
      {
        return await response.EnsureSuccessStatusCodeAsync();
      }
      catch (HttpClientException ex)
      {
        switch (ex.StatusCode)
        {
          case HttpStatusCode.Unauthorized:
          case HttpStatusCode.Forbidden:
            throw;
        }

        if (string.IsNullOrEmpty(ex.Message)) throw;

        try
        {
          var err = JsonConvert.DeserializeObject<ErrorResponse>(ex.Message);

          if (!string.IsNullOrWhiteSpace(err?.Code) && !string.IsNullOrWhiteSpace(err?.Message))
            throw new HttpClientException(ex.StatusCode, $"{err.Code}: {err.Message}");
        }
        catch { }

        throw;
      }
    }
  }
}
