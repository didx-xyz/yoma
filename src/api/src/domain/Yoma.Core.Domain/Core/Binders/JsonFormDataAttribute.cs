using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Yoma.Core.Domain.Core.Binders
{
  [AttributeUsage(
    AttributeTargets.Property | AttributeTargets.Parameter,
    AllowMultiple = false,
    Inherited = true)]
  public sealed class JsonFormDataAttribute :
    Attribute,
    IBindingSourceMetadata,
    IBinderTypeProviderMetadata,
    IModelNameProvider
  {
    public BindingSource BindingSource => BindingSource.Form;

    public Type BinderType => typeof(JsonFormDataModelBinder);

    public string? Name { get; set; }
  }
}
