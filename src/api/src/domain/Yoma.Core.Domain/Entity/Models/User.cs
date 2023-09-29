using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Entity.Models
{
    public class User
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public bool EmailConfirmed { get; set; }

        public string FirstName { get; set; }

        public string Surname { get; set; }

        public string? DisplayName { get; set; }

        public string? PhoneNumber { get; set; }

        public Guid? CountryId { get; set; }

        public string? Country { get; set; }

        public Guid? CountryOfResidenceId { get; set; }

        public string? CountryOfResidence { get; set; }

        public Guid? GenderId { get; set; }

        public string? Gender { get; set; }

        public DateTimeOffset? DateOfBirth { get; set; }

        public Guid? PhotoId { get; set; }

        public string? PhotoURL { get; set; }

        public DateTimeOffset? DateLastLogin { get; set; }

        public Guid? ExternalId { get; set; }

        public string? ZltoWalletId { get; set; }

        public DateTimeOffset? DateZltoWalletCreated { get; set; }

        public string? TenantId { get; set; }

        public DateTimeOffset? DateTenantCreated { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }

        public List<Skill>? Skills { get; set; }
    }
}
