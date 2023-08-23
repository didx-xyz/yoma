using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Repositories
{
    public class OpportunityRepository : BaseRepository<Entities.Opportunity>, IRepositoryValueContainsWithNavigation<Domain.Opportunity.Models.Opportunity>
    {
        #region Constructor
        public OpportunityRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.Opportunity.Models.Opportunity> Query()
        {
            return Query(false);
        }

        public IQueryable<Domain.Opportunity.Models.Opportunity> Query(bool includeChildItems)
        {
            return _context.Opportunity.Select(entity => new Domain.Opportunity.Models.Opportunity()
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                TypeId = entity.TypeId,
                Type = entity.Type.Name,
                OrganizationId = entity.OrganizationId,
                Organization = entity.Organization.Name,
                Instructions = entity.Instructions,
                URL = entity.URL,
                ZltoReward = entity.ZltoReward,
                YomaReward = entity.YomaReward,
                ZltoRewardPool = entity.ZltoRewardPool,
                YomaRewardPool = entity.YomaRewardPool,
                VerificationSupported = entity.VerificationSupported,
                DifficultyId = entity.DifficultyId,
                Difficulty = entity.Difficulty.Name,
                CommitmentIntervalId = entity.CommitmentIntervalId,
                CommitmentInterval = entity.CommitmentInterval.Name,
                CommitmentIntervalCount = entity.CommitmentIntervalCount,
                ParticipantLimit = entity.ParticipantLimit,
                ParticipantCount = entity.ParticipantCount,
                StatusId = entity.StatusId,
                Status = Enum.Parse<Status>(entity.Status.Name, true),
                Keywords = entity.Keywords,
                DateStart = entity.DateStart,
                DateEnd = entity.DateEnd,
                DateCreated = entity.DateCreated,
                CreatedBy = entity.CreatedBy,
                DateModified = entity.DateModified,
                ModifiedBy = entity.ModifiedBy,
                Categories = includeChildItems ?
                    entity.Categories.Select(o => new Domain.Opportunity.Models.Lookups.OpportunityCategory { Id = o.CategoryId, Name = o.Category.Name }).ToList() : null,
                Countries = includeChildItems ?
                    entity.Countries.Select(o => new Domain.Lookups.Models.Country
                    { Id = o.CountryId, Name = o.Country.Name, CodeAlpha2 = o.Country.CodeAlpha2, CodeAlpha3 = o.Country.CodeAlpha3, CodeNumeric = o.Country.CodeNumeric }).ToList() : null,
                Languages = includeChildItems ?
                    entity.Languages.Select(o => new Domain.Lookups.Models.Language { Id = o.LanguageId, Name = o.Language.Name, CodeAlpha2 = o.Language.CodeAlpha2 }).ToList() : null,
                Skills = includeChildItems ?
                    entity.Skills.Select(o => new Domain.Lookups.Models.Skill { Id = o.SkillId, Name = o.Skill.Name, InfoURL = o.Skill.InfoURL }).ToList() : null
            });
        }

        public Expression<Func<Domain.Opportunity.Models.Opportunity, bool>> Contains(Expression<Func<Domain.Opportunity.Models.Opportunity, bool>> predicate, string value)
        {
            return predicate.Or(o => o.Title.Contains(value) || (!string.IsNullOrEmpty(o.Keywords) && o.Keywords.Contains(value)) || EF.Functions.FreeText(o.Description, value));
        }

        public IQueryable<Domain.Opportunity.Models.Opportunity> Contains(IQueryable<Domain.Opportunity.Models.Opportunity> query, string value)
        {
            return query.Where(o => o.Title.Contains(value) || (!string.IsNullOrEmpty(o.Keywords) && o.Keywords.Contains(value)) || EF.Functions.FreeText(o.Description, value));
        }

        public async Task<Domain.Opportunity.Models.Opportunity> Create(Domain.Opportunity.Models.Opportunity item)
        {
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.Opportunity
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                TypeId = item.TypeId,
                OrganizationId = item.OrganizationId,
                Instructions = item.Instructions,
                URL = item.URL,
                ZltoReward = item.ZltoReward,
                YomaReward = item.YomaReward,
                ZltoRewardPool = item.ZltoRewardPool,
                YomaRewardPool = item.YomaRewardPool,
                VerificationSupported = item.VerificationSupported,
                DifficultyId = item.DifficultyId,
                CommitmentIntervalId = item.CommitmentIntervalId,
                CommitmentIntervalCount = item.CommitmentIntervalCount,
                ParticipantLimit = item.ParticipantLimit,
                ParticipantCount = item.ParticipantCount,
                StatusId = item.StatusId,
                Keywords = item.Keywords,
                DateStart = item.DateStart,
                DateEnd = item.DateEnd,
                DateCreated = item.DateCreated,
                CreatedBy = item.CreatedBy,
                DateModified = item.DateModified,
                ModifiedBy = item.ModifiedBy,
            };

            _context.Opportunity.Add(entity);

            await _context.SaveChangesAsync();
            item.Id = entity.Id;

            return item;
        }

        public async Task Update(Domain.Opportunity.Models.Opportunity item)
        {
            var entity = _context.Opportunity.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.Opportunity)} with id '{item.Id}' does not exist");

            entity.Title = item.Title;
            entity.Description = item.Description;
            entity.TypeId = item.TypeId;
            entity.OrganizationId = item.OrganizationId;
            entity.Instructions = item.Instructions;
            entity.URL = item.URL;
            entity.ZltoReward = item.ZltoReward;
            entity.YomaReward = item.YomaReward;
            entity.ZltoRewardPool = item.ZltoRewardPool;
            entity.YomaRewardPool = item.YomaRewardPool;
            entity.VerificationSupported = item.VerificationSupported;
            entity.DifficultyId = item.DifficultyId;
            entity.CommitmentIntervalId = item.CommitmentIntervalId;
            entity.CommitmentIntervalCount = item.CommitmentIntervalCount;
            entity.ParticipantLimit = item.ParticipantLimit;
            entity.ParticipantCount = item.ParticipantCount;
            entity.StatusId = item.StatusId;
            entity.Keywords = item.Keywords;
            entity.DateStart = item.DateStart;
            entity.DateEnd = item.DateEnd;
            entity.DateModified = DateTimeOffset.Now;
            entity.ModifiedBy = item.ModifiedBy;

            await _context.SaveChangesAsync();
        }

        public Task Delete(Domain.Opportunity.Models.Opportunity item)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
