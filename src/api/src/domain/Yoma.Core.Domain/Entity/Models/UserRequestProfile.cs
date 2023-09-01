using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
    public class UserRequestProfile : UserRequestBase
    {
        [Required]
        public bool ResetPassword { get; set; }
    }
}
