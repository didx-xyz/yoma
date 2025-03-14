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
        _logger.LogError(ex, "An internal server error occurred: {errorMessage}", ex.Message);
        throw;
      }
    }
  }
}
