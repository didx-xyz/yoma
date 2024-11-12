using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Services
{
  public class SSEListenerService : ISSEListenerService
  {
    #region Class Variables
    private readonly ILogger<SSEListenerService> _logger;
    private readonly ClientFactory _clientFactory;
    #endregion

    #region Constructor
    public SSEListenerService(ILogger<SSEListenerService> logger, ClientFactory clientFactory)
    {
      _logger = logger;
      _clientFactory = clientFactory;
    }
    #endregion

    #region Public Members
    public async Task<WebhookEvent<T>?> Listen<T>(
        string tenantId,
        Topic topic,
        string fieldName,
        string fieldValue,
        string desiredState)
       where T : class
    {
      if (string.IsNullOrWhiteSpace(tenantId))
        throw new ArgumentNullException(nameof(tenantId));
      tenantId = tenantId.Trim();

      if (string.IsNullOrWhiteSpace(fieldName))
        throw new ArgumentNullException(nameof(fieldName));
      fieldName = fieldName.Trim();

      if (string.IsNullOrWhiteSpace(tenantId))
        throw new ArgumentNullException(nameof(fieldValue));
      fieldValue = fieldValue.Trim();

      if (string.IsNullOrWhiteSpace(desiredState))
        throw new ArgumentNullException(nameof(desiredState));
      desiredState = desiredState.Trim();

      return await CreateClient<T>(tenantId, topic, fieldName, fieldValue, desiredState);
    }
    #endregion

    #region Private Members
    private async Task<WebhookEvent<T>?> CreateClient<T>(string tenantId, Topic topic, string fieldName, string fieldValue, string desiredState) where T : class
    {
      using var stream = await _clientFactory.CreateTenantAdminSSEClientSingleEvent(tenantId, topic, fieldName, fieldValue, desiredState);
      WebhookEvent<T>? result = null;
      using (var reader = new StreamReader(stream))
      {
        while (!reader.EndOfStream)
        {
          var msg = await reader.ReadLineAsync();
          if (string.IsNullOrEmpty(msg) || msg.StartsWith(": ping")) continue;

          if (!msg.StartsWith("data: "))
          {
            _logger.LogError("Unexpected SSE message: {msg}", msg);
            continue;
          }
          msg = msg[6..];

          return JsonConvert.DeserializeObject<WebhookEvent<T>>(msg);
        }
      }

      return result;
    }
    #endregion
  }
}
