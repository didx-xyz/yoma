using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Infrastructure.Database.Lookups.Repositories
{
    public class SkillRepository : BaseRepository<Skill>, IRepositoryBatchedValueContains<Domain.Lookups.Models.Skill>
    {
        #region Constructor
        public SkillRepository(ApplicationDbContext context) : base(context)
        {
        }
        #endregion

        #region Public Members
        public IQueryable<Domain.Lookups.Models.Skill> Query()
        {
            return _context.Skill.Select(entity => new Domain.Lookups.Models.Skill
            {
                Id = entity.Id,
                Name = entity.Name,
                ExternalId = entity.ExternalId,
                InfoURL = entity.InfoURL,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified
            });
        }

        public Expression<Func<Domain.Lookups.Models.Skill, bool>> Contains(Expression<Func<Domain.Lookups.Models.Skill, bool>> predicate, string value)
        {
            return predicate.Or(o => o.Name.Contains(value));
        }

        public IQueryable<Domain.Lookups.Models.Skill> Contains(IQueryable<Domain.Lookups.Models.Skill> query, string value)
        {
            return query.Where(o => o.Name.Contains(value));
        }

        public async Task<Domain.Lookups.Models.Skill> Create(Domain.Lookups.Models.Skill item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Skill
            {
                Id = item.Id,
                Name = item.Name,
                ExternalId = item.ExternalId,
                InfoURL = item.InfoURL,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            };

            _context.Skill.Add(entity);

            await _context.SaveChangesAsync();

            item.Id = entity.Id;

            return item;
        }

        public async Task<List<Domain.Lookups.Models.Skill>> Create(List<Domain.Lookups.Models.Skill> items)
        {
            if (items == null || !items.Any())
                throw new ArgumentNullException(nameof(items));

            items.ForEach(item =>
            {
                item.DateCreated = DateTimeOffset.Now;
                item.DateModified = DateTimeOffset.Now;
            });

            var entities = items.Select(item =>
            new Skill
            {
                Id = item.Id,
                Name = item.Name,
                ExternalId = item.ExternalId,
                InfoURL = item.InfoURL,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified
            });

            _context.Skill.AddRange(entities);

            await _context.SaveChangesAsync();

            return items;
        }

        public async Task Update(Domain.Lookups.Models.Skill item)
        {
            var entity = _context.Skill.Where(o => o.Id == item.Id).SingleOrDefault() ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Skill)} with id '{item.Id}' does not exist");
            entity.Name = item.Name;
            entity.InfoURL = item.InfoURL;
            entity.DateModified = DateTimeOffset.Now;

            await _context.SaveChangesAsync();
        }

        public async Task Update(List<Domain.Lookups.Models.Skill> items)
        {
            if (items == null || !items.Any())
                throw new ArgumentNullException(nameof(items));

            var itemIds = items.Select(o => o.Id).ToList();
            var entities = _context.Skill.Where(o => itemIds.Contains(o.Id));

            foreach (var item in items)
            {
                var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Skill)} with id '{item.Id}' does not exist");
                var updated = !entity.Name.Equals(item.Name, StringComparison.InvariantCultureIgnoreCase);
                if (!updated) updated = !string.Equals(entity.InfoURL, item.InfoURL, StringComparison.CurrentCultureIgnoreCase);
                if (!updated) continue;

                entity.Name = item.Name;
                entity.InfoURL = item.InfoURL;
                entity.DateModified = DateTimeOffset.Now;
            }

            _context.Skill.UpdateRange(entities);

            await _context.SaveChangesAsync();
        }

        public Task Delete(Domain.Lookups.Models.Skill item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
