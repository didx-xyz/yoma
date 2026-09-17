namespace Yoma.Core.Infrastructure.Umuzi.Models
{
  internal static class ContractValidation
  {
    // One whitelist is shared by catalogue validation and mapping, so a newly supported
    // type cannot pass one stage but be rejected by the other.
    internal static Domain.Opportunity.Type ParseOpportunityType(string? value)
    {
      value = value?.Trim();
      if (string.Equals(value, nameof(Domain.Opportunity.Type.Learning), StringComparison.OrdinalIgnoreCase))
        return Domain.Opportunity.Type.Learning;
      if (string.Equals(value, nameof(Domain.Opportunity.Type.Job), StringComparison.OrdinalIgnoreCase))
        return Domain.Opportunity.Type.Job;
      throw new InvalidOperationException($"Umuzi opportunity type '{value}' is not supported");
    }

    internal static void ValidatePage<T>(PageResponse<T> page, int expectedPage, int? expectedTotal, int? expectedPageSize)
    {
      ArgumentNullException.ThrowIfNull(page);
      if (page.Page != expectedPage || page.PageSize < 1 || page.PageSize > Constants.PageSizeMaximum ||
          page.TotalItems < 0 || page.Items == null)
        throw new InvalidOperationException("Umuzi returned invalid pagination metadata");
      if ((expectedTotal.HasValue && page.TotalItems != expectedTotal) ||
          (expectedPageSize.HasValue && page.PageSize != expectedPageSize))
        throw new InvalidOperationException("Umuzi pagination changed during snapshot retrieval");
      var offset = ((long)page.Page - 1) * page.PageSize;
      var expectedCount = Math.Min(page.PageSize, Math.Max(0L, page.TotalItems - offset));
      if (page.Items.Count != expectedCount)
        throw new InvalidOperationException($"Umuzi page '{page.Page}' contains '{page.Items.Count}' items; expected '{expectedCount}'");
    }
  }
}
