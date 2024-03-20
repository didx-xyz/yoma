using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
  public class ReformatValidationProblemAttribute : ActionFilterAttribute
  {
    public override void OnResultExecuting(ResultExecutingContext context)
    {
      if (context.Result is BadRequestObjectResult badRequestObjectResult)
      {
        if (badRequestObjectResult.Value is ValidationProblemDetails validationProblemDetails && validationProblemDetails.Errors.Any())
        {
          var errorResponse = new List<ErrorResponseItem>();
          foreach (var error in validationProblemDetails.Errors.Values)
          {
            errorResponse.Add(
                new ErrorResponseItem
                {
                  Type = nameof(ValidationException),
                  Message = string.Join(", ", error.Select(o => o))
                });
          }
          context.Result = new BadRequestObjectResult(errorResponse);
        }
      }

      base.OnResultExecuting(context);
    }
  }
}
