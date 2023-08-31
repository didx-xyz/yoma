namespace Yoma.Core.Domain.Opportunity
{
    public enum Status
    {
        Active, //flagged as expired provided ended (notified)
        Deleted, 
        Expired, //flagged as deleted if expired for x days
        Inactive, //flagged expired provided ended (notified), or as deleted if inactive for x days
    }
}
