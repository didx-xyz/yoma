using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Entity.Validators;
using FluentValidation;
using System.Transactions;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.SSI.Interfaces;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.SSI.Helpers;

namespace Yoma.Core.Domain.Entity.Services
{
    public class UserService : IUserService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IIdentityProviderClient _identityProviderClient;
        private readonly IBlobService _blobService;
        private readonly IGenderService _genderService;
        private readonly ICountryService _countryService;
        private readonly ISkillService _skillService;
        private readonly ISSITenantService _ssiTenantCreationService;
        private readonly ISSICredentialService _ssiCredentialIssuanceService;
        private readonly UserRequestValidator _userRequestValidator;
        private readonly UserSearchFilterValidator _userSearchFilterValidator;
        private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
        private readonly IRepository<UserSkill> _userSkillRepository;
        #endregion

        #region Constructor
        public UserService(
            IOptions<AppSettings> appSettings,
            IIdentityProviderClientFactory identityProviderClientFactory,
            IBlobService blobService,
            IGenderService genderService,
            ICountryService countryService,
            ISkillService skillService,
            ISSITenantService ssiTenantCreationService,
            ISSICredentialService ssiCredentialIssuanceService,
            UserRequestValidator userValidator,
            UserSearchFilterValidator userSearchFilterValidator,
            IRepositoryValueContainsWithNavigation<User> userRepository,
            IRepository<UserSkill> userSkillRepository)
        {
            _appSettings = appSettings.Value;
            _identityProviderClient = identityProviderClientFactory.CreateClient();
            _blobService = blobService;
            _genderService = genderService;
            _countryService = countryService;
            _skillService = skillService;
            _ssiTenantCreationService = ssiTenantCreationService;
            _ssiCredentialIssuanceService = ssiCredentialIssuanceService;
            _userRequestValidator = userValidator;
            _userSearchFilterValidator = userSearchFilterValidator;
            _userRepository = userRepository;
            _userSkillRepository = userSkillRepository;
        }
        #endregion

        #region Public Members
        public User GetByEmail(string? email, bool includeChildItems, bool includeComputed)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentNullException(nameof(email));

            var result = GetByEmailOrNull(email, includeChildItems, includeComputed)
                ?? throw new ValidationException($"User with email '{email}' does not exist");

            return result;
        }

        public User? GetByEmailOrNull(string email, bool includeChildItems, bool includeComputed)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentNullException(nameof(email));
            email = email.Trim();

            var result = _userRepository.Query(includeChildItems).SingleOrDefault(o => o.Email == email);
            if (result == null) return null;

            if (includeComputed) result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }

        public User GetById(Guid id, bool includeChildItems, bool includeComputed)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = GetByIdOrNull(id, includeChildItems, includeComputed)
                ?? throw new ArgumentOutOfRangeException(nameof(id), $"{nameof(User)} with id '{id}' does not exist");

            return result;
        }

        public User? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _userRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
            if (result == null) return null;

            if (includeComputed) result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }

        public List<User> Contains(string value, bool includeComputed)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException(nameof(value));
            value = value.Trim();

            var results = _userRepository.Contains(_userRepository.Query(), value).ToList();

            if (includeComputed) results.ForEach(o => o.PhotoURL = GetBlobObjectURL(o.PhotoId));

            return results;
        }

        public UserSearchResults Search(UserSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            _userSearchFilterValidator.ValidateAndThrow(filter);

            var query = _userRepository.Query();

            //only includes users which email has been confirmed (implies linked to identity provider)
            query = query.Where(o => o.EmailConfirmed);

            if (!string.IsNullOrEmpty(filter.ValueContains))
                query = _userRepository.Contains(query, filter.ValueContains);

            var results = new UserSearchResults();
            query = query.OrderBy(o => o.DisplayName);

            if (filter.PaginationEnabled)
            {
                results.TotalCount = query.Count();
                query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
            }
            results.Items = query.ToList().Select(o => o.ToInfo()).ToList();

            return results;
        }

        public async Task<User> Upsert(UserRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            await _userRequestValidator.ValidateAndThrowAsync(request);

            // check if user exists
            var isNew = !request.Id.HasValue;
            var result = !request.Id.HasValue ? new User { Id = Guid.NewGuid() } : GetById(request.Id.Value, true, true);

            var existingByEmail = GetByEmailOrNull(request.Email, false, false);
            if (existingByEmail != null && (isNew || result.Id != existingByEmail.Id))
                throw new ValidationException($"{nameof(User)} with the specified email address '{request.Email}' already exists");

            // profile fields updatable via UserProfileService.Update; identity provider is source of truth
            if (isNew)
            {
                var kcUser = await _identityProviderClient.GetUser(result.Email)
                    ?? throw new InvalidOperationException($"{nameof(User)} with email '{result.Email}' does not exist");
                result.Email = request.Email;
                result.FirstName = request.FirstName;
                result.Surname = request.Surname;
                result.DisplayName = request.DisplayName ?? string.Empty;
                result.SetDisplayName();
                result.PhoneNumber = request.PhoneNumber;
                result.CountryId = request.CountryId;
                result.CountryOfResidenceId = request.CountryOfResidenceId;
                result.GenderId = request.GenderId;
                result.DateOfBirth = request.DateOfBirth.RemoveTime();
            }

            result.EmailConfirmed = request.EmailConfirmed;
            result.DateLastLogin = request.DateLastLogin;
            result.ExternalId = request.ExternalId;

            result = isNew ? await _userRepository.Create(result) : await _userRepository.Update(result);

            return result;
        }

        public async Task<User> UpsertPhoto(string? email, IFormFile? file)
        {
            var result = GetByEmail(email, true, false);

            if (file == null)
                throw new ArgumentNullException(nameof(file));

            var currentPhoto = result.PhotoId.HasValue ? new { Id = result.PhotoId.Value, File = await _blobService.Download(result.PhotoId.Value) } : null;

            BlobObject? blobObject = null;
            try
            {
                using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
                blobObject = await _blobService.Create(file, FileType.Photos);
                result.PhotoId = blobObject.Id;
                result = await _userRepository.Update(result);

                if (currentPhoto != null)
                    await _blobService.Delete(currentPhoto.Id);

                scope.Complete();
            }
            catch
            {
                //roll back
                if (blobObject != null)
                    await _blobService.Delete(blobObject);

                if (currentPhoto != null)
                    await _blobService.Create(currentPhoto.Id, currentPhoto.File);

                throw;
            }


            result.PhotoURL = GetBlobObjectURL(result.PhotoId);

            return result;
        }

        public async Task AssignSkills(Guid id, List<Guid> skillIds)
        {
            var user = GetById(id, false, false);

            if (skillIds == null || !skillIds.Any())
                throw new ArgumentNullException(nameof(skillIds));

            skillIds = skillIds.Distinct().ToList();

            var results = new List<Domain.Lookups.Models.Skill>();

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
            foreach (var skillId in skillIds)
            {
                var skill = _skillService.GetById(skillId);
                results.Add(skill);

                var item = _userSkillRepository.Query().SingleOrDefault(o => o.UserId == user.Id && o.SkillId == skill.Id);
                if (item != null) continue;

                item = new UserSkill
                {
                    UserId = user.Id,
                    SkillId = skill.Id
                };

                await _userSkillRepository.Create(item);
            }

            scope.Complete();
        }

        public async Task<User> YoIDOnboard(string? email)
        {
            var result = GetByEmail(email, false, false);

            if (result.YoIDOnboarded.HasValue && result.YoIDOnboarded.Value)
                throw new ValidationException($"User with email '{email}' has already completed YoID onboarding");

            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            result.YoIDOnboarded = true;
            result = await _userRepository.Update(result);

            await _ssiTenantCreationService.ScheduleCreation(EntityType.User, result.Id);
            await _ssiCredentialIssuanceService.ScheduleIssuance(_appSettings.SSISchemaFullNameYoID, result.Id);

            scope.Complete();

            return result;
        }
        #endregion

        #region Private Members
        private string? GetBlobObjectURL(Guid? id)
        {
            if (!id.HasValue) return null;
            return _blobService.GetURL(id.Value);
        }
        #endregion
    }
}
