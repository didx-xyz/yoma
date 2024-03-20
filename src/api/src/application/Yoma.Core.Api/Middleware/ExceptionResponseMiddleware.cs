using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Exceptions;

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
        await HandleExceptionAsync(httpContext, ex);
      }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
      context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; //default

      List<ErrorResponseItem> errorResponse;
      switch (ex)
      {
        case FluentValidation.ValidationException:
          var validationException = (FluentValidation.ValidationException)ex;
          context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

          if (!validationException.Errors.Any()) break;

          errorResponse = validationException.Errors.Select(o => new ErrorResponseItem() { Type = ex.GetType().Name, Message = o.ErrorMessage }).ToList();
          return context.Response.WriteAsJsonAsync(errorResponse);

        case EntityNotFoundException:
          context.Response.StatusCode = (int)HttpStatusCode.NotFound;
          break;
        case BusinessException:
        case ValidationException:
          context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
          break;
        case SecurityException:
        case System.Security.SecurityException:
          context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
          break;
        case DataCollisionException:
        case DataInconsistencyException:
          context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
          break;

        case HttpClientException:
          var httpClientException = (HttpClientException)ex;
          context.Response.StatusCode = (int)httpClientException.StatusCode;
          break;
      }

      errorResponse =
      [
        new() { Type = ex.GetType().Name, Message =ex.Message }
      ];

      return context.Response.WriteAsJsonAsync(errorResponse);
    }
  }
}
