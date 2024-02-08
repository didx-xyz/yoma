using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Interfaces
{
    public interface ISSEListenerService
    {
        Task<WebhookEvent<T>?> Listen<T>(string tenantId, Topic topic, string desiredState) where T : class;

        Task<WebhookEvent<T>?> Listen<T>(string tenantId, Topic topic, string fieldName, string fieldValue, string desiredState) where T : class;
    }
}
