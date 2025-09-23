namespace Yoma.Core.Api.Middleware
{
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
        var exType = ex is AggregateException ae ? ae.GetBaseException().GetType().Name : ex.GetType().Name;

        _logger.LogError(ex, "{ExceptionType}: {ErrorMessage}", exType, ex.Message);
        throw;
      }
    }
  }
}
