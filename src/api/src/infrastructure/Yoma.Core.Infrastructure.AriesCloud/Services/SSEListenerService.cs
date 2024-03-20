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
        string desiredState)
        where T : class
    {
      tenantId = tenantId.Trim();
      if (string.IsNullOrEmpty(tenantId))
        throw new ArgumentNullException(nameof(tenantId));

      desiredState = desiredState.Trim();
      if (string.IsNullOrEmpty(tenantId))
        throw new ArgumentNullException(nameof(desiredState));

      return await CreateClient<T>(tenantId, topic, desiredState, null, null);
    }

    public async Task<WebhookEvent<T>?> Listen<T>(
        string tenantId,
        Topic topic,
        string fieldName,
        string fieldValue,
        string desiredState)
       where T : class
    {
      tenantId = tenantId.Trim();
      if (string.IsNullOrEmpty(tenantId))
        throw new ArgumentNullException(nameof(tenantId));

      fieldName = fieldName.Trim();
      if (string.IsNullOrEmpty(fieldName))
        throw new ArgumentNullException(nameof(fieldName));

      fieldValue = fieldValue.Trim();
      if (string.IsNullOrEmpty(tenantId))
        throw new ArgumentNullException(nameof(fieldValue));

      desiredState = desiredState.Trim();
      if (string.IsNullOrEmpty(desiredState))
        throw new ArgumentNullException(nameof(desiredState));

      return await CreateClient<T>(tenantId, topic, desiredState, fieldName, fieldValue);
    }
    #endregion

    #region Private Members
    private async Task<WebhookEvent<T>?> CreateClient<T>(string tenantId, Topic topic, string desiredState, string? fieldName, string? fieldValue) where T : class
    {
      using var stream = await _clientFactory.CreateTenantAdminSSEClientSingleEvent(tenantId, topic, desiredState, fieldName, fieldValue);
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
