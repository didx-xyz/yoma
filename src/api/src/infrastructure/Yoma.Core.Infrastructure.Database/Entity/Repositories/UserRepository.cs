using Hangfire.Storage.Monitoring;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.BlobProvider;
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
        PhoneNumberConfirmed = entity.PhoneNumberConfirmed,
        CountryId = entity.CountryId,
        Country = entity.Country == null ? null : entity.Country.Name,
        EducationId = entity.EducationId,
        Education = entity.Education == null ? null : entity.Education.Name,
        PhotoId = entity.PhotoId,
        PhotoStorageType = entity.Photo == null ? null : Enum.Parse<StorageType>(entity.Photo.StorageType, true),
        PhotoKey = entity.Photo == null ? null : entity.Photo.Key,
        GenderId = entity.GenderId,
        Gender = entity.Gender == null ? null : entity.Gender.Name,
        DateOfBirth = entity.DateOfBirth,
        DateLastLogin = entity.DateLastLogin,
        ExternalId = entity.ExternalId,
        YoIDOnboarded = entity.YoIDOnboarded,
        DateYoIDOnboarded = entity.DateYoIDOnboarded,
        SettingsRaw = entity.Settings,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
        Skills = entity.Skills == null ? null : includeChildItems ?
              entity.Skills.Select(o => new Domain.Entity.Models.UserSkillInfo
              {
                Id = o.SkillId,
                Name = o.Skill.Name,
                InfoURL = o.Skill.InfoURL,
                Organizations = o.Organizations.Select(o => new Domain.Entity.Models.UserSkillOrganizationInfo
                {
                  Id = o.Id,
                  Name = o.Organization.Name,
                  LogoId = o.Organization.LogoId,
                  LogoStorageType = o.Organization.Logo == null ? null : Enum.Parse<StorageType>(o.Organization.Logo.StorageType, true),
                  LogoKey = o.Organization.Logo == null ? null : o.Organization.Logo.Key,
                }).OrderBy(o => o.Name).ToList()

              }).OrderBy(o => o.Name).ToList() : null
      }).AsSplitQuery();
    }

    public Expression<Func<Domain.Entity.Models.User, bool>> Contains(Expression<Func<Domain.Entity.Models.User, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.FirstName, $"%{value}%") || EF.Functions.ILike(o.Surname, $"%{value}%") || EF.Functions.ILike(o.Email, $"%{value}%") || EF.Functions.ILike(o.DisplayName, $"%{value}%"));
    }

    public IQueryable<Domain.Entity.Models.User> Contains(IQueryable<Domain.Entity.Models.User> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.FirstName, $"%{value}%") || EF.Functions.ILike(o.Surname, $"%{value}%") || EF.Functions.ILike(o.Email, $"%{value}%") || EF.Functions.ILike(o.DisplayName, $"%{value}%"));
    }

    public async Task<Domain.Entity.Models.User> Create(Domain.Entity.Models.User item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new User
      {
        Id = item.Id,
        Email = item.Email,
        EmailConfirmed = item.EmailConfirmed,
        FirstName = item.FirstName,
        Surname = item.Surname,
        DisplayName = item.DisplayName,
        PhoneNumber = item.PhoneNumber,
        PhoneNumberConfirmed = item.PhoneNumberConfirmed,
        CountryId = item.CountryId,
        EducationId = item.EducationId,
        PhotoId = item.PhotoId,
        GenderId = item.GenderId,
        DateOfBirth = item.DateOfBirth,
        DateLastLogin = item.DateLastLogin,
        ExternalId = item.ExternalId,
        YoIDOnboarded = item.YoIDOnboarded,
        DateYoIDOnboarded = item.DateYoIDOnboarded,
        Settings = item.SettingsRaw,
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

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Email = item.Email;
      entity.EmailConfirmed = item.EmailConfirmed;
      entity.FirstName = item.FirstName;
      entity.Surname = item.Surname;
      entity.DisplayName = item.DisplayName;
      entity.PhoneNumber = item.PhoneNumber;
      entity.PhoneNumberConfirmed = item.PhoneNumberConfirmed;
      entity.CountryId = item.CountryId;
      entity.EducationId = item.EducationId;
      entity.PhotoId = item.PhotoId;
      entity.GenderId = item.GenderId;
      entity.DateOfBirth = item.DateOfBirth;
      entity.DateLastLogin = item.DateLastLogin;
      entity.ExternalId = item.ExternalId;
      entity.YoIDOnboarded = item.YoIDOnboarded;
      entity.DateYoIDOnboarded = item.DateYoIDOnboarded;
      entity.Settings = item.SettingsRaw;
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
