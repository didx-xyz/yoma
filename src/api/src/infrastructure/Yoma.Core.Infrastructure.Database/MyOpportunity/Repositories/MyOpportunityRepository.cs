using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories
{
    public class MyOpportunityRepository : BaseRepository<Entities.MyOpportunity, Guid>, IRepositoryBatchedWithNavigation<Domain.MyOpportunity.Models.MyOpportunity>
    {
        #region Constructor
        public MyOpportunityRepository(ApplicationDbContext context) : base(context) { }
        #endregion

        #region Public Members
        public IQueryable<Domain.MyOpportunity.Models.MyOpportunity> Query()
        {
            return Query(false);
        }

        public IQueryable<Domain.MyOpportunity.Models.MyOpportunity> Query(bool includeChildItems)
        {
            return _context.MyOpportunity.Select(entity => new Domain.MyOpportunity.Models.MyOpportunity()
            {
                Id = entity.Id,
                UserId = entity.UserId,
                UserEmail = entity.User.Email,
                UserDisplayName = entity.User.DisplayName,
                OpportunityId = entity.OpportunityId,
                OpportunityTitle = entity.Opportunity.Title,
                OpportunityType = entity.Opportunity.Type.Name,
                OpportunityStatusId = entity.Opportunity.StatusId,
                OpportunityStatus = Enum.Parse<Status>(entity.Opportunity.Status.Name, true),
                OpportunityDateStart = entity.Opportunity.DateStart,
                OrganizationId = entity.Opportunity.OrganizationId,
                OrganizationName = entity.Opportunity.Organization.Name,
                OrganizationLogoId = entity.Opportunity.Organization.LogoId,
                OrganizationStatusId = entity.Opportunity.Organization.StatusId,
                OrganizationStatus = Enum.Parse<OrganizationStatus>(entity.Opportunity.Organization.Status.Name, true),
                ActionId = entity.ActionId,
                Action = Enum.Parse<Domain.MyOpportunity.Action>(entity.Action.Name, true),
                VerificationStatusId = entity.VerificationStatusId,
                VerificationStatus = entity.VerificationStatus != null ? Enum.Parse<VerificationStatus>(entity.VerificationStatus.Name, true) : null,
                CommentVerification = entity.CommentVerification,
                DateStart = entity.DateStart,
                DateEnd = entity.DateEnd,
                DateCompleted = entity.DateCompleted,
                ZltoReward = entity.ZltoReward,
                YomaReward = entity.YomaReward,
                DateCreated = entity.DateCreated,
                DateModified = entity.DateModified,
                Verifications = entity.Verifications == null ? null : includeChildItems ?
                    entity.Verifications.Select(o => new Domain.MyOpportunity.Models.MyOpportunityVerification
                    {
                        Id = o.Id,
                        MyOpportunityId = o.MyOpportunityId,
                        VerificationTypeId = o.VerificationTypeId,
                        VerificationType = Enum.Parse<VerificationType>(o.VerificationType.Name, true),
                        GeometryProperties = o.GeometryProperties,
                        FileId = o.FileId,
                        DateCreated = o.DateCreated
                    }).ToList() : null
            });
        }

        public async Task<Domain.MyOpportunity.Models.MyOpportunity> Create(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            item.DateCredentialIssued = string.IsNullOrEmpty(item.CredentialId) ? null : DateTimeOffset.Now;
            item.DateCreated = DateTimeOffset.Now;
            item.DateModified = DateTimeOffset.Now;

            var entity = new Entities.MyOpportunity
            {
                Id = item.Id,
                UserId = item.UserId,
                OpportunityId = item.OpportunityId,
                ActionId = item.ActionId,
                VerificationStatusId = item.VerificationStatusId,
                CommentVerification = item.CommentVerification,
                DateStart = item.DateStart,
                DateEnd = item.DateEnd,
                DateCompleted = item.DateCompleted,
                ZltoReward = item.ZltoReward,
                YomaReward = item.YomaReward,
                CredentialId = item.CredentialId,
                DateCredentialIssued = item.DateCredentialIssued,
                DateCreated = item.DateCreated,
                DateModified = item.DateModified,
            };

            _context.MyOpportunity.Add(entity);
            await _context.SaveChangesAsync();

            item.Id = entity.Id;
            return item;
        }

        public async Task<List<Domain.MyOpportunity.Models.MyOpportunity>> Create(List<Domain.MyOpportunity.Models.MyOpportunity> items)
        {
            if (items == null || !items.Any())
                throw new ArgumentNullException(nameof(items));

            var entities = items.Select(item =>
              new Entities.MyOpportunity
              {
                  Id = item.Id,
                  UserId = item.UserId,
                  OpportunityId = item.OpportunityId,
                  ActionId = item.ActionId,
                  VerificationStatusId = item.VerificationStatusId,
                  CommentVerification = item.CommentVerification,
                  DateStart = item.DateStart,
                  DateEnd = item.DateEnd,
                  DateCompleted = item.DateCompleted,
                  ZltoReward = item.ZltoReward,
                  YomaReward = item.YomaReward,
                  CredentialId = item.CredentialId,
                  DateCredentialIssued = string.IsNullOrEmpty(item.CredentialId) ? null : DateTimeOffset.Now,
                  DateCreated = DateTimeOffset.Now,
                  DateModified = DateTimeOffset.Now,
              });

            _context.MyOpportunity.AddRange(entities);
            await _context.SaveChangesAsync();

            items = items.Zip(entities, (item, entity) =>
            {
                item.Id = entity.Id;
                item.DateCredentialIssued = entity.DateCredentialIssued;
                item.DateCreated = entity.DateCreated;
                item.DateModified = entity.DateModified;
                return item;
            }).ToList();

            return items;
        }

        public async Task<Domain.MyOpportunity.Models.MyOpportunity> Update(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            var entity = _context.MyOpportunity.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.MyOpportunity)} with id '{item.Id}' does not exist");

            item.DateCredentialIssued = string.IsNullOrEmpty(item.CredentialId)
                ? null
                : item.CredentialId != entity.CredentialId ? DateTimeOffset.Now : entity.DateCredentialIssued;
            item.DateModified = DateTimeOffset.Now;

            entity.ActionId = item.ActionId;
            entity.VerificationStatusId = item.VerificationStatusId;
            entity.CommentVerification = item.CommentVerification;
            entity.DateStart = item.DateStart;
            entity.DateEnd = item.DateEnd;
            entity.DateCompleted = item.DateCompleted;
            entity.ZltoReward = item.ZltoReward;
            entity.YomaReward = item.YomaReward;
            entity.CredentialId = item.CredentialId;
            entity.DateCredentialIssued = item.DateCredentialIssued;
            entity.DateModified = item.DateModified;

            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<List<Domain.MyOpportunity.Models.MyOpportunity>> Update(List<Domain.MyOpportunity.Models.MyOpportunity> items)
        {
            if (items == null || !items.Any())
                throw new ArgumentNullException(nameof(items));

            var itemIds = items.Select(o => o.Id).ToList();
            var entities = _context.MyOpportunity.Where(o => itemIds.Contains(o.Id));

            foreach (var item in items)
            {
                var entity = entities.SingleOrDefault(o => o.Id == item.Id) ?? throw new InvalidOperationException($"{nameof(Entities.MyOpportunity)} with id '{item.Id}' does not exist");

                item.DateCredentialIssued = string.IsNullOrEmpty(item.CredentialId)
                    ? null
                    : item.CredentialId != entity.CredentialId ? DateTimeOffset.Now : entity.DateCredentialIssued;
                item.DateModified = DateTimeOffset.Now;

                entity.ActionId = item.ActionId;
                entity.VerificationStatusId = item.VerificationStatusId;
                entity.CommentVerification = item.CommentVerification;
                entity.DateStart = item.DateStart;
                entity.DateEnd = item.DateEnd;
                entity.DateCompleted = item.DateCompleted;
                entity.ZltoReward = item.ZltoReward;
                entity.YomaReward = item.YomaReward;
                entity.CredentialId = item.CredentialId;
                entity.DateCredentialIssued = item.DateCredentialIssued;
                entity.DateModified = item.DateModified;
            }

            _context.MyOpportunity.UpdateRange(entities);
            await _context.SaveChangesAsync();

            return items;
        }

        public async Task Delete(Domain.MyOpportunity.Models.MyOpportunity item)
        {
            var entity = _context.MyOpportunity.Where(o => o.Id == item.Id).SingleOrDefault()
                ?? throw new ArgumentOutOfRangeException(nameof(item), $"{nameof(Entities.MyOpportunity)} with id '{item.Id}' does not exist");
            _context.MyOpportunity.Remove(entity);
            await _context.SaveChangesAsync();
        }
        #endregion
    }
}
