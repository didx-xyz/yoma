namespace Yoma.Core.Domain.MyOpportunity
{
    public enum Action
    {
        Viewed,
        Saved,
        Verification
    }

    public enum VerificationStatus
    {
        Pending, //flagged as rejected if pending for x days
        Rejected,
        Completed
    }
}
