namespace Yoma.Core.Api.Middleware
{
  /* TODO: Log at different levels based on the exception type
    FluentValidation.ValidationException → Info (→ 400 Bad Request)
    ValidationException → Info (→ 400 Bad Request)
    EntityNotFoundException → Info (→ 404 Not Found)
    SecurityException / System.Security.SecurityException → Warning (→ 401 Unauthorized)
    HttpClientException →
    401 / 403 → Warning (→ 401 Unauthorized)
    404 → Info (→ 404 Not Found)
    Other 4xx → Info (→ 400 Bad Request)
    5xx → Error (→ 500 Internal Server Error)
    All others → Error (→ 500 Internal Server Error)
  */
  public class ExceptionLogMiddleware
  {
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionLogMiddleware> _logger;

    public ExceptionLogMiddleware(RequestDelegate next, ILogger<ExceptionLogMiddleware> logger)
    {
      _next = next;
      _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
      try
      {
        await _next(httpContext);
      }
      catch (Exception ex)
      {
        var exNormalized = ex is AggregateException agg ? agg.Flatten() : ex;
        var typeName = exNormalized.GetType().Name;
        _logger.LogError(ex, "An {exceptionType} occurred: {errorMessage}", typeName, exNormalized.Message);
        throw;
      }
    }
  }
}
