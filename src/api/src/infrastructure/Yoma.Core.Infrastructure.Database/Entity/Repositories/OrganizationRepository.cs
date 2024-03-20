using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
  public class OrganizationRepository : BaseRepository<Organization, Guid>, IRepositoryBatchedValueContainsWithNavigation<Domain.Entity.Models.Organization>
  {
    #region Constructor
    public OrganizationRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<Domain.Entity.Models.Organization> Query()
    {
      return Query(false);
    }

    public IQueryable<Domain.Entity.Models.Organization> Query(bool includeChildItems)
    {
      return _context.Organization.Select(entity => new Domain.Entity.Models.Organization()
      {
        Id = entity.Id,
        Name = entity.Name,
        NameHashValue = entity.NameHashValue,
        WebsiteURL = entity.WebsiteURL,
        PrimaryContactName = entity.PrimaryContactName,
        PrimaryContactEmail = entity.PrimaryContactEmail,
        PrimaryContactPhone = entity.PrimaryContactPhone,
        VATIN = entity.VATIN,
        TaxNumber = entity.TaxNumber,
        RegistrationNumber = entity.RegistrationNumber,
        City = entity.City,
        CountryId = entity.CountryId,
        Country = entity.Country == null ? null : entity.Country.Name,
        StreetAddress = entity.StreetAddress,
        Province = entity.Province,
        PostalCode = entity.PostalCode,
        Tagline = entity.Tagline,
        Biography = entity.Biography,
        StatusId = entity.StatusId,
        Status = Enum.Parse<OrganizationStatus>(entity.Status.Name, true),
        CommentApproval = entity.CommentApproval,
        DateStatusModified = entity.DateStatusModified,
        LogoId = entity.LogoId,
        DateCreated = entity.DateCreated,
        CreatedByUserId = entity.CreatedByUserId,
        DateModified = entity.DateModified,
        ModifiedByUserId = entity.ModifiedByUserId,
        ProviderTypes = includeChildItems ?
              entity.ProviderTypes.Select(o => new Domain.Entity.Models.Lookups.OrganizationProviderType { Id = o.ProviderTypeId, Name = o.ProviderType.Name }).ToList() : null,
        Documents = includeChildItems ?
              entity.Documents.Select(o => new Domain.Entity.Models.OrganizationDocument
              {
                Id = o.Id,
                OrganizationId = o.OrganizationId,
                FileId = o.FileId,
                Type = Enum.Parse<OrganizationDocumentType>(o.Type, true),
                ContentType = o.File.ContentType,
                OriginalFileName = o.File.OriginalFileName,
                DateCreated = o.DateCreated
              }).OrderBy(o => o.DateCreated).ToList() : null,
        Administrators = includeChildItems ?
              entity.Administrators.Select(o => new Domain.Entity.Models.UserInfo
              {
                Id = o.UserId,
                Email = o.User.Email,
                FirstName = o.User.FirstName,
                Surname = o.User.Surname,
                DisplayName = o.User.DisplayName
              }).OrderBy(o => o.DisplayName).ToList() : null

      }).AsSplitQuery(); //AsSingleQuery() causes bottlenecks
    }

    public Expression<Func<Domain.Entity.Models.Organization, bool>> Contains(Expression<Func<Domain.Entity.Models.Organization, bool>> predicate, string value)
    {
      //MS SQL: Contains
      return predicate.Or(o => EF.Functions.ILike(o.Name, $"%{value}%"));
    }

    public IQueryable<Domain.Entity.Models.Organization> Contains(IQueryable<Domain.Entity.Models.Organization> query, string value)
    {
      //MS SQL: Contains
      return query.Where(o => EF.Functions.ILike(o.Name, $"%{value}%"));
    }

    public async Task<Domain.Entity.Models.Organization> Create(Domain.Entity.Models.Organization item)
    {
      item.DateStatusModified = DateTimeOffset.UtcNow;
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      var entity = new Organization
      {
        Id = item.Id,
        Name = item.Name,
        NameHashValue = item.NameHashValue,
        WebsiteURL = item.WebsiteURL,
        PrimaryContactName = item.PrimaryContactName,
        PrimaryContactEmail = item.PrimaryContactEmail,
        PrimaryContactPhone = item.PrimaryContactPhone,
        VATIN = item.VATIN,
        TaxNumber = item.TaxNumber,
        RegistrationNumber = item.RegistrationNumber,
        City = item.City,
        CountryId = item.CountryId,
        StreetAddress = item.StreetAddress,
        Province = item.Province,
        PostalCode = item.PostalCode,
        Tagline = item.Tagline,
        Biography = item.Biography,
        StatusId = item.StatusId,
        CommentApproval = item.CommentApproval,
        DateStatusModified = item.DateStatusModified,
        LogoId = item.LogoId,
        DateCreated = item.DateCreated,
        CreatedByUserId = item.CreatedByUserId,
        DateModified = item.DateModified,
        ModifiedByUserId = item.ModifiedByUserId,
      };

      _context.Organization.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<List<Domain.Entity.Models.Organization>> Create(List<Domain.Entity.Models.Organization> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var entities = items.Select(item =>
         new Organization
         {
           Id = item.Id,
           Name = item.Name,
           NameHashValue = item.NameHashValue,
           WebsiteURL = item.WebsiteURL,
           PrimaryContactName = item.PrimaryContactName,
           PrimaryContactEmail = item.PrimaryContactEmail,
           PrimaryContactPhone = item.PrimaryContactPhone,
           VATIN = item.VATIN,
           TaxNumber = item.TaxNumber,
           RegistrationNumber = item.RegistrationNumber,
           City = item.City,
           CountryId = item.CountryId,
           StreetAddress = item.StreetAddress,
           Province = item.Province,
           PostalCode = item.PostalCode,
           Tagline = item.Tagline,
           Biography = item.Biography,
           StatusId = item.StatusId,
           CommentApproval = item.CommentApproval,
           DateStatusModified = DateTimeOffset.UtcNow,
           LogoId = item.LogoId,
           DateCreated = DateTimeOffset.UtcNow,
           CreatedByUserId = item.CreatedByUserId,
           DateModified = DateTimeOffset.UtcNow,
           ModifiedByUserId = item.ModifiedByUserId
         });

      _context.Organization.AddRange(entities);
      await _context.SaveChangesAsync();

      items = items.Zip(entities, (item, entity) =>
      {
        item.Id = entity.Id;
        item.DateStatusModified = entity.DateStatusModified;
        item.DateCreated = entity.DateCreated;
        item.DateModified = entity.DateModified;
        return item;
      }).ToList();

      return items;
    }

    public async Task<Domain.Entity.Models.Organization> Update(Domain.Entity.Models.Organization item)
    {
      var entity = _context.Organization.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Organization)} with id '{item.Id}' does not exist");

      if (item.StatusId != entity.StatusId) item.DateStatusModified = DateTimeOffset.UtcNow;
      item.DateModified = DateTimeOffset.UtcNow;

      entity.Name = item.Name;
      entity.WebsiteURL = item.WebsiteURL;
      entity.PrimaryContactName = item.PrimaryContactName;
      entity.PrimaryContactEmail = item.PrimaryContactEmail;
      entity.PrimaryContactPhone = item.PrimaryContactPhone;
      entity.VATIN = item.VATIN;
      entity.TaxNumber = item.TaxNumber;
      entity.RegistrationNumber = item.RegistrationNumber;
      entity.City = item.City;
      entity.CountryId = item.CountryId;
      entity.StreetAddress = item.StreetAddress;
      entity.Province = item.Province;
      entity.PostalCode = item.PostalCode;
      entity.Tagline = item.Tagline;
      entity.Biography = item.Biography;
      entity.DateStatusModified = item.DateStatusModified;
      entity.StatusId = item.StatusId;
      entity.CommentApproval = item.CommentApproval;
      entity.LogoId = item.LogoId;
      entity.DateModified = item.DateModified;
      entity.ModifiedByUserId = item.ModifiedByUserId;

      await _context.SaveChangesAsync();

      return item;
    }

    public async Task<List<Domain.Entity.Models.Organization>> Update(List<Domain.Entity.Models.Organization> items)
    {
      if (items == null || items.Count == 0)
        throw new ArgumentNullException(nameof(items));

      var itemIds = items.Select(o => o.Id).ToList();
      var entities = _context.Organization.Where(o => itemIds.Contains(o.Id));

      foreach (var item in items)
      {
        var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Organization)} with id '{item.Id}' does not exist");

        if (item.StatusId != entity.StatusId) item.DateStatusModified = DateTimeOffset.UtcNow;
        item.DateModified = DateTimeOffset.UtcNow;

        entity.Name = item.Name;
        entity.WebsiteURL = item.WebsiteURL;
        entity.PrimaryContactName = item.PrimaryContactName;
        entity.PrimaryContactEmail = item.PrimaryContactEmail;
        entity.PrimaryContactPhone = item.PrimaryContactPhone;
        entity.VATIN = item.VATIN;
        entity.TaxNumber = item.TaxNumber;
        entity.RegistrationNumber = item.RegistrationNumber;
        entity.City = item.City;
        entity.CountryId = item.CountryId;
        entity.StreetAddress = item.StreetAddress;
        entity.Province = item.Province;
        entity.PostalCode = item.PostalCode;
        entity.Tagline = item.Tagline;
        entity.Biography = item.Biography;
        entity.DateStatusModified = item.DateStatusModified;
        entity.StatusId = item.StatusId;
        entity.CommentApproval = item.CommentApproval;
        entity.LogoId = item.LogoId;
        entity.DateModified = item.DateModified;
        entity.ModifiedByUserId = item.ModifiedByUserId;
      }

      _context.Organization.UpdateRange(entities);
      await _context.SaveChangesAsync();

      return items;
    }

    public Task Delete(Domain.Entity.Models.Organization item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
