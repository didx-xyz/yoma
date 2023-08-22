using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity;

namespace Yoma.Core.Infrastructure.Database.Entity.Repositories
{
    public class OrganizationRepository : BaseRepository<Organization>, IRepositoryValueContainsWithNavigation<Domain.Entity.Models.Organization>
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
                WebsiteURL = entity.WebsiteURL,
                PrimaryContactName = entity.PrimaryContactName,
                PrimaryContactEmail = entity.PrimaryContactEmail,
                PrimaryContactPhone = entity.PrimaryContactPhone,
                VATIN = entity.VATIN,
                TaxNumber = entity.TaxNumber,
                RegistrationNumber = entity.RegistrationNumber,
                City = entity.City,
                CountryId = entity.CountryId,
                StreetAddress = entity.StreetAddress,
                Province = entity.Province,
                PostalCode = entity.PostalCode,
                Tagline = entity.Tagline,
                Biography = entity.Biography,
                StatusId = entity.StatusId,
                Status = Enum.Parse<OrganizationStatus>(entity.Status.Name, true),
                LogoId = entity.LogoId,
                CompanyRegistrationDocumentId = entity.CompanyRegistrationDocumentId,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified,
                ProviderTypes = includeChildItems ?
                    entity.ProviderTypes.Select(o => new Domain.Entity.Models.Lookups.OrganizationProviderType { Id = o.ProviderTypeId, Name = o.ProviderType.Name }).ToList() : null
            });
        }

        public Expression<Func<Domain.Entity.Models.Organization, bool>> Contains(Expression<Func<Domain.Entity.Models.Organization, bool>> predicate, string value)
        {
            return predicate.Or(o => o.Name.Contains(value));
        }

        public IQueryable<Domain.Entity.Models.Organization> Contains(IQueryable<Domain.Entity.Models.Organization> query, string value)
        {
            return query.Where(o => o.Name.Contains(value));
        }

        public async Task<Domain.Entity.Models.Organization> Create(Domain.Entity.Models.Organization item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;
            item.DateStatusModified = DateTimeOffset.Now;

            var entity = new Organization
            {
                Id = item.Id,
                Name = item.Name,
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
                DateStatusModified = item.DateStatusModified,
                LogoId = item.LogoId,
                CompanyRegistrationDocumentId = item.CompanyRegistrationDocumentId,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.Organization.Add(entity);

            await _context.SaveChangesAsync();
            item.Id = entity.Id;

            return item;
        }

        public async Task Update(Domain.Entity.Models.Organization item)
        {
            var entity = _context.Organization.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Organization)} with id '{item.Id}' does not exist");
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
            if (entity.StatusId != item.StatusId)
                entity.DateStatusModified = DateTimeOffset.Now;
            entity.StatusId = item.StatusId;
            entity.LogoId = item.LogoId;
            entity.CompanyRegistrationDocumentId = item.CompanyRegistrationDocumentId;
            entity.DateModified = DateTimeOffset.Now;

            await _context.SaveChangesAsync();
        }

        public Task Delete(Domain.Entity.Models.Organization item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
