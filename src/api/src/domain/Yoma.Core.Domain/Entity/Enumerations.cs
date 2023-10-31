namespace Yoma.Core.Domain.Entity
{
    public enum OrganizationStatus
    {
        Inactive, //flagged as declined if inactive for x days
        Active,
        Declined, //flagged as deleted if declined for x days
        Deleted
    }

    public enum OrganizationDocumentType
    {
        Registration,
        EducationProvider,
        Business
    }

    public enum OrganizationProviderType
    {
        Education,
        Marketplace
    }

    public enum EntityType
    {
        User,
        Organization
    }
}
