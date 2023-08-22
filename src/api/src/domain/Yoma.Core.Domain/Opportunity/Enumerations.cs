namespace Yoma.Core.Domain.Opportunity
{
    public enum Status
    {
        Active,
        Deleted, //permanently deleted if not referenced else flagged as deleted
        Expired,
        Inactive,
    }
}
