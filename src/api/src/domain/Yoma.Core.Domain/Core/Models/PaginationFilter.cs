using Microsoft.AspNetCore.Mvc.ModelBinding;
using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;

namespace Yoma.Core.Domain.Core.Models
{
  public class PaginationFilter
  {
    public int? PageNumber { get; set; }

    public int? PageSize { get; set; }

    [JsonIgnore]
    [BindNever]
    [MemberNotNull(nameof(PageNumber), nameof(PageSize))]
#pragma warning disable CS8774 // Member must have a non-null value when exiting. Validated by AbstractValidator
    public bool PaginationEnabled => PageSize.HasValue || PageNumber.HasValue;
#pragma warning restore CS8774 // Member must have a non-null value when exiting. Validated by AbstractValidator

  }
}
