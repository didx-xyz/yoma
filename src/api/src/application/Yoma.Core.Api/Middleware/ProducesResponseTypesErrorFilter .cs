using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Net;
using System.Net.Mime;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Api.Middleware
{
  public class ProducesResponseTypesErrorFilter : IOperationFilter
  {
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
      var errorSchema = context.SchemaGenerator.GenerateSchema(typeof(List<ErrorResponseItem>), context.SchemaRepository);

      var content = new Dictionary<string, OpenApiMediaType>
      {
        [MediaTypeNames.Application.Json] = new OpenApiMediaType { Schema = errorSchema }
      };

      var errorResponses = new Dictionary<int, OpenApiResponse>
      {
        [(int)HttpStatusCode.BadRequest] = new OpenApiResponse
        {
          Description = $"Bad Request - The request could not be understood or was missing required parameters",
          Content = content
        },
        [(int)HttpStatusCode.Unauthorized] = new OpenApiResponse
        {
          Description = $"Unauthorized - Access is denied due to invalid credentials or role authorization",
          Content = content
        },
        [(int)HttpStatusCode.NotFound] = new OpenApiResponse
        {
          Description = $"Not Found - The requested resource could not be found",
          Content = content
        },
        [(int)HttpStatusCode.InternalServerError] = new OpenApiResponse
        {
          Description = "Internal Server Error - An unexpected error occurred on the server",
          Content = content
        }
      };

      foreach (var errorResponse in errorResponses)
        operation.Responses[errorResponse.Key.ToString()] = errorResponse.Value;
    }
  }
}
