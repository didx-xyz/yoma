namespace Yoma.Core.Domain.Opportunity.Extensions
{
    public static class OpportunityExtensions
    {
        public static void SetPublished(this Models.Opportunity opportunity)
        {
            if (opportunity == null)
                throw new ArgumentNullException(nameof(opportunity));

            opportunity.Published = opportunity.Status == Status.Active && opportunity.OrganizationStatus == Entity.OrganizationStatus.Active;
        }
    }
}
