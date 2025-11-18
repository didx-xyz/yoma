using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Api.Middleware
{
  public class ExceptionLogMiddleware
  {
    #region Class Variables
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionLogMiddleware> _logger;

    private const string LogTemplate = "Request {method} {path} failed with {type} ({status}): {msg}";
    #endregion

    #region Public Constructor
    public ExceptionLogMiddleware(RequestDelegate next, ILogger<ExceptionLogMiddleware> logger)
    {
      _next = next ?? throw new ArgumentNullException(nameof(next));
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    #endregion

    #region Public Members
    public async Task InvokeAsync(HttpContext httpContext)
    {
      try { await _next(httpContext); }
      catch (Exception ex)
      {
        var e = ex is AggregateException agg ? agg.Flatten() : ex;
        var (level, status) = Classify(e);
        var type = e.GetType().Name;

        var method = httpContext.Request?.Method ?? "method:unknown";
        method = method.SanitizeLogValue();

        var path = httpContext.Request?.Path.Value ?? "path:unknown";
        path = path.SanitizeLogValue();

        LogAtLevel(level, e, method, path, type, status, e.Message);

        throw;
      }
    }
    #endregion

    #region Private Members
    private static (LogLevel, HttpStatusCode) Classify(Exception ex) => ex switch
    {
      FluentValidation.ValidationException or ValidationException => (LogLevel.Information, HttpStatusCode.BadRequest),
      EntityNotFoundException => (LogLevel.Information, HttpStatusCode.NotFound),
      SecurityException or System.Security.SecurityException => (LogLevel.Warning, HttpStatusCode.Unauthorized),
      HttpClientException http => http.StatusCode switch
      {
        HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => (LogLevel.Warning, HttpStatusCode.Unauthorized),
        HttpStatusCode.NotFound => (LogLevel.Information, HttpStatusCode.NotFound),
        >= HttpStatusCode.BadRequest and < HttpStatusCode.InternalServerError => (LogLevel.Information, HttpStatusCode.BadRequest),
        >= HttpStatusCode.InternalServerError and <= (HttpStatusCode)599 => (LogLevel.Error, HttpStatusCode.InternalServerError),
        _ => (LogLevel.Error, HttpStatusCode.InternalServerError)
      },
      _ => (LogLevel.Error, HttpStatusCode.InternalServerError)
    };

    private void LogAtLevel(LogLevel level, Exception ex, string method, string path, string type, HttpStatusCode status, string text)
    {
      switch (level)
      {
        case LogLevel.Information:
          _logger.LogInformation(ex, LogTemplate, method, path, type, (int)status, text);
          break;
        case LogLevel.Warning:
          _logger.LogWarning(ex, LogTemplate, method, path, type, (int)status, text);
          break;
        default:
          _logger.LogError(ex, LogTemplate, method, path, type, (int)status, text);
          break;
      }
    }
    #endregion
  }
}
