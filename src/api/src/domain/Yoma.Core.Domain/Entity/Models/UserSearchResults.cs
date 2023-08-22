namespace Yoma.Core.Domain.Entity.Models
{
    public class UserSearchResults
    {
        public int? TotalCount { get; set; }

        public List<UserInfo> Items { get; set; }
    }
}
