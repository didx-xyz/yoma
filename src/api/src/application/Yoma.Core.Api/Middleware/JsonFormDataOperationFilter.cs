using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;
using Yoma.Core.Domain.Core.Binders;

namespace Yoma.Core.Api.Middleware
{
  public sealed class JsonFormDataOperationFilter : IOperationFilter
  {
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
      if (operation.RequestBody?.Content == null ||
          !operation.RequestBody.Content.TryGetValue(
            "multipart/form-data",
            out var mediaType) ||
          mediaType.Schema?.Properties == null)
        return;

      foreach (var parameterInfo in context.MethodInfo.GetParameters())
      {
        foreach (var propertyInfo in parameterInfo.ParameterType.GetProperties())
        {
          var attribute =
            propertyInfo.GetCustomAttribute<JsonFormDataAttribute>();

          if (attribute == null) continue;

          var propertyName = attribute.Name ?? propertyInfo.Name;

          var schemaPropertyName =
            mediaType.Schema.Properties.Keys.FirstOrDefault(o =>
              string.Equals(
                o,
                propertyName,
                StringComparison.OrdinalIgnoreCase));

          if (schemaPropertyName == null) continue;

          mediaType.Schema.Properties[schemaPropertyName] =
            new OpenApiSchema
            {
              Type = JsonSchemaType.String,
              Description =
                "A JSON-encoded value supplied as one multipart form field."
            };

          mediaType.Encoding ??=
            new Dictionary<string, OpenApiEncoding>();

          mediaType.Encoding[schemaPropertyName] =
            new OpenApiEncoding
            {
              ContentType = "application/json",
              Style = ParameterStyle.Form,
              Explode = false
            };
        }
      }
    }
  }
}
