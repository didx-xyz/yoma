using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Services
{
    public class UserProfileService : IUserProfileService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IOrganizationService _organizationService;
        #endregion

        #region Constructor
        public UserProfileService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            IOrganizationService organizationService)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _organizationService = organizationService;
        }
        #endregion

        #region Public Members
        public UserProfile Get()
        {
            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);

            var user = _userService.GetByEmail(username);

            var result = user.ToProfile();

            result.AdminsOf = _organizationService.ListAdminsOf();

            return result;
        }

        public async Task<UserProfile> UpsertPhoto(IFormFile file)
        {
            var username = HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false);

            var user = await _userService.UpsertPhoto(username, file);

            var result = user.ToProfile();

            result.AdminsOf = _organizationService.ListAdminsOf();

            return result;
        }
        #endregion
    }
}
