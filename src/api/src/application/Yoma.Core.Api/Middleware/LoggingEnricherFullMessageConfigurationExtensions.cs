using Serilog.Configuration;
using Serilog;

namespace Yoma.Core.Api.Middleware
{
  public static class LoggingEnricherFullMessageConfigurationExtensions
  {
    public static LoggerConfiguration IncludeFullMessage(this LoggerEnrichmentConfiguration enrichmentConfig)
    {
      return enrichmentConfig.With<LoggingEnricherFullMessage>();
    }
  }
}
