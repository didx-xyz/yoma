namespace Yoma.Core.Domain.Entity
{
    public enum OrganizationStatus
    {
        Inactive, //flagged as declined with x days
        Active,
        Declined, //flagged as deleted with x days
        Deleted //permanently deleted if not referenced else flagged as deleted
    }
}
