using System.Linq.Expressions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
  public class OpportunityCountryRepository : BaseRepository<Entities.OpportunityCountry, Guid>, IRepositoryPropertyContainsWithSpatial<OpportunityCountry>
  {
    #region Constructor
    public OpportunityCountryRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<OpportunityCountry> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<OpportunityCountry> Query()
    {
      return _context.OpportunityCountries.Select(entity => new OpportunityCountry
      {
        Id = entity.Id,
        OpportunityId = entity.OpportunityId,
        OpportunityStatusId = entity.Opportunity.Status.Id,
        OpportunityDateStart = entity.Opportunity.DateStart,
        OpportunityDateEnd = entity.Opportunity.DateEnd,
        OpportunityHidden = entity.Opportunity.Hidden,
        OrganizationId = entity.Opportunity.OrganizationId,
        OrganizationStatusId = entity.Opportunity.Organization.Status.Id,
        CountryId = entity.CountryId,
        CountryName = entity.Country.Name,
        Region = entity.Region,
        City = entity.City,
        Coordinates = Core.Helpers.CoordinatesHelper.ToArray(entity.Coordinates),
        HasCoordinates = entity.Coordinates != null,
        DateModified = entity.DateModified,
        DateCreated = entity.DateCreated
      });
    }

    public Expression<Func<OpportunityCountry, bool>> Contains(Expression<Func<OpportunityCountry, string?>> property, string value)
    {
      return Core.Helpers.PropertyContainsHelper.Contains(property, value);
    }

    public IQueryable<OpportunityCountry> Contains(IQueryable<OpportunityCountry> query, Expression<Func<OpportunityCountry, string?>> property, string value)
    {
      ArgumentNullException.ThrowIfNull(query);

      return query.Where(Contains(property, value));
    }

    public IQueryable<OpportunityCountry> WithinRadius(IQueryable<OpportunityCountry> query, double[] coordinates, double radiusKm)
    {
      ArgumentNullException.ThrowIfNull(query);
      ArgumentNullException.ThrowIfNull(coordinates);

      var centre = Core.Helpers.CoordinatesHelper.ToPoint(coordinates)!;
      var distanceMetres = radiusKm * 1000;

      // Geography uses metres; Npgsql translates this to index-aware ST_DWithin.
      var matchingIds = _context.OpportunityCountries
        .Where(o => o.Coordinates != null && o.Coordinates.IsWithinDistance(centre, distanceMetres))
        .Select(o => o.Id);

      return query.Where(o => matchingIds.Contains(o.Id));
    }

    public async Task<OpportunityCountry> Create(OpportunityCountry item)
    {
      item.DateCreated = DateTimeOffset.UtcNow;
      item.DateModified = item.DateCreated;

      var entity = new Entities.OpportunityCountry
      {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        CountryId = item.CountryId,
        Region = item.Region,
        City = item.City,
        Coordinates = Core.Helpers.CoordinatesHelper.ToPoint(item.Coordinates),
        DateModified = item.DateModified,
        DateCreated = item.DateCreated,
      };

      _context.OpportunityCountries.Add(entity);
      await _context.SaveChangesAsync();

      item.Id = entity.Id;
      return item;
    }

    public async Task<OpportunityCountry> Update(OpportunityCountry item)
    {
      var entity = _context.OpportunityCountries.SingleOrDefault(o => o.Id == item.Id)
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityCountry)} with id '{item.Id}' does not exist");

      item.DateModified = DateTimeOffset.UtcNow;

      entity.Region = item.Region;
      entity.City = item.City;
      entity.Coordinates = Core.Helpers.CoordinatesHelper.ToPoint(item.Coordinates);
      entity.DateModified = item.DateModified;

      await _context.SaveChangesAsync();
      return item;
    }

    public async Task Delete(OpportunityCountry item)
    {
      var entity = _context.OpportunityCountries
        .Where(o => o.Id == item.Id)
        .SingleOrDefault()
        ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(OpportunityCountry)} with id '{item.Id}' does not exist");

      _context.OpportunityCountries.Remove(entity);
      await _context.SaveChangesAsync();
    }
    #endregion
  }
}
