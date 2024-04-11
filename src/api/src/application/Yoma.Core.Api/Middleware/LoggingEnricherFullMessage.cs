using Serilog.Core;
using Serilog.Events;

namespace Yoma.Core.Api.Middleware
{
  public class LoggingEnricherFullMessage : ILogEventEnricher
  {
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
      var renderedMessage = logEvent.RenderMessage();
      logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("Message", renderedMessage));
    }
  }
}
