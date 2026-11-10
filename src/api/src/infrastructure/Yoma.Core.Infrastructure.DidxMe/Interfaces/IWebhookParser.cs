using Yoma.Core.Infrastructure.DidxMe.Models;

namespace Yoma.Core.Infrastructure.DidxMe.Interfaces
{
  public interface IWebhookParser
  {
    WebhookResult? Parse(string body, string? id, string? timestamp, string? signature);
  }
}
