using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
  public class ExceptionResponseMiddleware
  {
    private readonly RequestDelegate _next;

    public ExceptionResponseMiddleware(RequestDelegate next)
    {
      _next = next;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
      try
      {
        await _next(httpContext);
      }
      catch (Exception ex)
      {
        // A disconnected client cannot receive an error body. A started response belongs to the server.
        if (httpContext.RequestAborted.IsCancellationRequested) return;
        if (httpContext.Response.HasStarted) throw;

        try
        {
          await HandleExceptionAsync(httpContext, ex);
        }
        catch (OperationCanceledException) when (httpContext.RequestAborted.IsCancellationRequested)
        {
          // The client disconnected while the error response was being written.
        }
        catch (IOException) when (httpContext.RequestAborted.IsCancellationRequested)
        {
          // The transport closed while the error response was being written.
        }
      }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
      context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; //default
      var exNormalized = ex;

      List<ErrorResponseItem> errorResponse;
      switch (exNormalized)
      {
        case BadHttpRequestException badHttpRequestException:
          // Includes server-specific subclasses; retain the request failure's original HTTP status.
          context.Response.StatusCode = badHttpRequestException.StatusCode;
          break;

        case FluentValidation.ValidationException validationException:
          context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

          if (!validationException.Errors.Any()) break;

          errorResponse = [.. validationException.Errors.Select(o => new ErrorResponseItem() { Type = exNormalized.GetType().Name, Message = o.ErrorMessage })];
          return context.Response.WriteAsJsonAsync(errorResponse, cancellationToken: context.RequestAborted);

        case EntityNotFoundException:
          context.Response.StatusCode = (int)HttpStatusCode.NotFound;
          break;

        case RequestInProgressException:
          context.Response.StatusCode = (int)HttpStatusCode.Conflict;
          break;

        case BusinessException:
        case ValidationException:
          context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
          break;

        case SecurityException:
        case System.Security.SecurityException:
          context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
          break;

        case AggregateException aggregateException:
          exNormalized = aggregateException.Flatten();
          break;

        case HttpClientException httpClientException:
          //ensure B2B codes reflects the codes supported by the API
          context.Response.StatusCode = (int)httpClientException.StatusCode switch
          {
            (int)HttpStatusCode.Unauthorized => (int)HttpStatusCode.Unauthorized,
            (int)HttpStatusCode.Forbidden => (int)HttpStatusCode.Unauthorized,
            (int)HttpStatusCode.NotFound => (int)HttpStatusCode.NotFound,
            >= 400 and < 500 => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
          };
          break;
      }

      errorResponse = [new() { Type = exNormalized.GetType().Name, Message = exNormalized.Message }];

      return context.Response.WriteAsJsonAsync(errorResponse, cancellationToken: context.RequestAborted);
    }
  }
}
