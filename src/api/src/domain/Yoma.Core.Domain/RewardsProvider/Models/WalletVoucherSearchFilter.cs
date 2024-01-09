using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.RewardsProvider.Models
{
    public class WalletVoucherSearchFilter : PaginationFilter
    {
        public string WalletId { get; set; }    
    }
}
