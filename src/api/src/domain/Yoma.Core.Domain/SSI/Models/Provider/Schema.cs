namespace Yoma.Core.Domain.SSI.Models.Provider
{
    public class Schema
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public Version Version { get; set; }

        public ArtifactType ArtifactType { get; set; }

        public ICollection<string> AttributeNames { get; set; }
    }
}
