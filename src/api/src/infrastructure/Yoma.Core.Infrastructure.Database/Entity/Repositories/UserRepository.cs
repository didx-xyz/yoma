using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
    public class UserRepository : BaseRepository<User, Guid>, IRepositoryValueContainsWithNavigation<Domain.Entity.Models.User>
    {
        #region Constructor
        public UserRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.Entity.Models.User> Query()
        {
            return Query(false);
        }

        public IQueryable<Domain.Entity.Models.User> Query(bool includeChildItems)
        {
            return _context.User.Select(entity => new Domain.Entity.Models.User()
            {
                Id = entity.Id,
                Email = entity.Email,
                EmailConfirmed = entity.EmailConfirmed,
                FirstName = entity.FirstName,
                Surname = entity.Surname,
                DisplayName = entity.DisplayName,
                PhoneNumber = entity.PhoneNumber,
                CountryId = entity.CountryId,
                Country = entity.Country == null ? null : entity.Country.Name,
                CountryOfResidenceId = entity.CountryOfResidenceId,
                CountryOfResidence = entity.CountryOfResidence == null ? null : entity.CountryOfResidence.Name,
                PhotoId = entity.PhotoId,
                GenderId = entity.GenderId,
                Gender = entity.Gender == null ? null : entity.Gender.Name,
                DateOfBirth = entity.DateOfBirth,
                DateLastLogin = entity.DateLastLogin,
                ExternalId = entity.ExternalId,
                ZltoWalletId = entity.ZltoWalletId,
                DateZltoWalletCreated = entity.DateZltoWalletCreated,
                YoIDOnboarded = entity.YoIDOnboarded,
                DateYoIDOnboarded = entity.DateYoIDOnboarded,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified,
                Skills = includeChildItems ?
                    entity.Skills.Select(o => new Domain.Lookups.Models.Skill { Id = o.SkillId, Name = o.Skill.Name, InfoURL = o.Skill.InfoURL }).ToList() : null
            }).AsSplitQuery();
        }

        public Expression<Func<Domain.Entity.Models.User, bool>> Contains(Expression<Func<Domain.Entity.Models.User, bool>> predicate, string value)
        {
            return predicate.Or(o => o.FirstName.Contains(value) || o.Surname.Contains(value) || o.Email.Contains(value) || o.DisplayName.Contains(value));
        }

        public IQueryable<Domain.Entity.Models.User> Contains(IQueryable<Domain.Entity.Models.User> query, string value)
        {
            return query.Where(o => o.FirstName.Contains(value) || o.Surname.Contains(value) || o.Email.Contains(value) || o.DisplayName.Contains(value));
        }

        public async Task<Domain.Entity.Models.User> Create(Domain.Entity.Models.User item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.DateZltoWalletCreated = string.IsNullOrEmpty(item.ZltoWalletId) ? null : DateTimeOffset.Now;
            item.DateYoIDOnboarded = !item.YoIDOnboarded.HasValue || !item.YoIDOnboarded.Value ? null : DateTimeOffset.Now;
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new User
            {
                Id = item.Id,
                Email = item.Email,
                EmailConfirmed = item.EmailConfirmed,
                FirstName = item.FirstName,
                Surname = item.Surname,
                DisplayName = item.DisplayName,
                PhoneNumber = item.PhoneNumber,
                CountryId = item.CountryId,
                CountryOfResidenceId = item.CountryOfResidenceId,
                PhotoId = item.PhotoId,
                GenderId = item.GenderId,
                DateOfBirth = item.DateOfBirth,
                DateLastLogin = item.DateLastLogin,
                ExternalId = item.ExternalId,
                ZltoWalletId = item.ZltoWalletId,
                DateZltoWalletCreated = item.DateZltoWalletCreated,
                YoIDOnboarded = item.YoIDOnboarded,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.User.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<Domain.Entity.Models.User> Update(Domain.Entity.Models.User item)
        {
            var entity = _context.User.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"User with id '{item.Id}' does not exist");

            item.DateZltoWalletCreated = string.IsNullOrEmpty(item.ZltoWalletId)
                ? null
                : item.ZltoWalletId != entity.ZltoWalletId ? DateTimeOffset.Now : entity.DateZltoWalletCreated;
            item.DateYoIDOnboarded = !item.YoIDOnboarded.HasValue || !item.YoIDOnboarded.Value
                ? null
                : item.YoIDOnboarded.Value && !entity.DateYoIDOnboarded.HasValue ? DateTimeOffset.Now : entity.DateYoIDOnboarded;
            item.DateModified = DateTimeOffset.Now;

            entity.Email = item.Email;
            entity.EmailConfirmed = item.EmailConfirmed;
            entity.FirstName = item.FirstName;
            entity.Surname = item.Surname;
            entity.DisplayName = item.DisplayName;
            entity.PhoneNumber = item.PhoneNumber;
            entity.CountryId = item.CountryId;
            entity.CountryOfResidenceId = item.CountryOfResidenceId;
            entity.PhotoId = item.PhotoId;
            entity.GenderId = item.GenderId;
            entity.DateOfBirth = item.DateOfBirth;
            entity.DateLastLogin = item.DateLastLogin;
            entity.ExternalId = item.ExternalId;
            entity.ZltoWalletId = item.ZltoWalletId;
            entity.DateZltoWalletCreated = item.DateZltoWalletCreated;
            entity.YoIDOnboarded = item.YoIDOnboarded;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public Task Delete(Domain.Entity.Models.User item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
