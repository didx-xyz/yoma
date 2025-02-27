namespace Yoma.Core.Domain.Analytics.Models
{
  public class OpportunityConversionRatio
  {
    public int ViewedCount { get; set; }

    public int ViewedCountFromNavigatedExternalLinkTracking { get; set; }

    public int NavigatedExternalLinkCount { get; set; }

    public int CompletedCount { get; set; }

    public int CompletedCountFromNavigatedExternalLinkTracking { get; set; }

    public decimal ViewedToNavigatedExternalLinkPercentage { get; set; }

    public decimal NavigatedExternalLinkToCompletedPercentage { get; set; }
  }
}
