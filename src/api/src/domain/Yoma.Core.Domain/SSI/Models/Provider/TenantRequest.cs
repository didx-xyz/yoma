namespace Yoma.Core.Domain.SSI.Models.Provider
{
    public class TenantRequest
    {
        public string Reference { get; set; }

        public string Name { get; set; }

        public List<Role> Roles { get; set; }

        public string? ImageUrl { get; set; }
    }
}
