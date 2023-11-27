namespace Yoma.Core.Domain.Entity.Models
{
    public class UserSkillOrganizationInfo
    {
        public Guid Id { get; set; }

        public string Name { get; set; }

        public Guid? LogoId { get; set; }

        public string? LogoURL { get; set; }
    }
}
