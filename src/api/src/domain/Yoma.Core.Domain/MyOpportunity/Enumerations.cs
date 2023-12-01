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
        None,
        Pending, //flagged as rejected if pending for x days
        Rejected,
        Completed
    }
}
