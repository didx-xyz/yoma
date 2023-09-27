namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaRequest
    {
        public string Name { get; set; }

        public ArtifactType ArtifactType { get; set; }  

        public List<string> Attributes { get; set; }
    }
}
