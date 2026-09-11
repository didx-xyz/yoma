using Microsoft.AspNetCore.Mvc.ModelBinding;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Converters;

namespace Yoma.Core.Domain.Core.Binders
{
  public sealed class JsonFormDataModelBinder : IModelBinder
  {
    #region Class Variables
    // Multipart JSON is deserialized outside MVC's JSON input formatter,
    // so preserve strings and apply the same trimming behavior explicitly.
    private static readonly JsonSerializerSettings SerializerSettings = new()
    {
      DateParseHandling = DateParseHandling.None,
      Converters =
      {
        new StringTrimmingConverter()
      }
    };
    #endregion

    #region Public Members
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
      ArgumentNullException.ThrowIfNull(bindingContext);

      var valueResult =
        bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

      if (valueResult == ValueProviderResult.None)
        return Task.CompletedTask;

      bindingContext.ModelState.SetModelValue(
        bindingContext.ModelName,
        valueResult);

      var value = string.Join(",", valueResult.ToArray()).Trim();
      if (string.IsNullOrEmpty(value))
      {
        bindingContext.Result = ModelBindingResult.Success(null);
        return Task.CompletedTask;
      }

      // Multipart clients may serialize collections as one JSON array, repeated
      // JSON form fields, or one comma-separated sequence of JSON objects.
      var isCollection =
        bindingContext.ModelType != typeof(string) &&
        !typeof(System.Collections.IDictionary)
          .IsAssignableFrom(bindingContext.ModelType) &&
        typeof(System.Collections.IEnumerable)
          .IsAssignableFrom(bindingContext.ModelType);

      if (isCollection && !value.StartsWith('['))
        value = $"[{value}]";

      try
      {
        var result = JsonConvert.DeserializeObject(
          value,
          bindingContext.ModelType,
          SerializerSettings);

        bindingContext.Result = ModelBindingResult.Success(result);
      }
      catch (JsonException ex)
      {
        bindingContext.ModelState.TryAddModelError(
          bindingContext.ModelName,
          ex,
          bindingContext.ModelMetadata);

        bindingContext.Result = ModelBindingResult.Failed();
      }

      return Task.CompletedTask;
    }
    #endregion
  }
}
