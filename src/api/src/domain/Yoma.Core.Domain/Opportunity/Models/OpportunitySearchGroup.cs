namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunitySearchGroup
  {
    /// <summary>
    /// Alternatives within this group. Groups themselves are AND-ed with the
    /// root selection and mandatory authorisation/visibility restrictions.
    /// </summary>
    public List<OpportunitySearchSelection> AnyOf { get; set; } = null!;
  }
}
