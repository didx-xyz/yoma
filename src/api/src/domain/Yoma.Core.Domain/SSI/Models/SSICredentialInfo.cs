using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models
{
    public class SSICredentialInfo : SSICredentialBase
    {
        [JsonIgnore]
        public override List<SSICredentialAttribute> Attributes { get => base.Attributes; set => base.Attributes = value; }
    }
}
