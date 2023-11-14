namespace Yoma.Core.Domain.SSI.Models
{
    public class SSIWalletSearchResults
    {
        public int? TotalCount { get; set; }

        public List<SSICredentialInfo> Items { get; set; }
    }
}
