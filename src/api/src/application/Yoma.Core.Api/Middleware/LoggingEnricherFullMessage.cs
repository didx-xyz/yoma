using Serilog.Core;
using Serilog.Events;

namespace Yoma.Core.Api.Middleware
{
  public class LoggingEnricherFullMessage : ILogEventEnricher
  {
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
      var renderedMessage = logEvent.RenderMessage();
      var cleanedMessage = RemoveDoubleQuotes(renderedMessage);
      logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("Message", cleanedMessage));
    }

    private string RemoveDoubleQuotes(string message)
    {
      // replace consecutive double quotes with a single quote
      return message.Replace("\"\"", "\"");
    }
  }
}
