using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities;

namespace Yoma.Core.Infrastructure.Database.Context
{
    public class ApplicationDbContext : DbContext
    {
        #region Constructors
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
        #endregion

        #region Public Members
        #region Core
        public DbSet<BlobObject> BlobObject { get; set; }
        #endregion Core

        #region Entity
        #region Lookups
        public DbSet<Entity.Entities.Lookups.OrganizationStatus> OrganizationStatus { get; set; }

        public DbSet<Entity.Entities.Lookups.OrganizationProviderType> OrganizationProviderType { get; set; }
        #endregion Lookups

        public DbSet<Organization> Organization { get; set; }

        public DbSet<OrganizationProviderType> OrganizationProviderTypes { get; set; }

        public DbSet<OrganizationUser> OrganizationUsers { get; set; }

        public DbSet<User> User { get; set; }

        public DbSet<UserSkill> UserSkills { get; set; }
        #endregion Entity

        #region Lookups
        public DbSet<Country> Country { get; set; }

        public DbSet<Gender> Gender { get; set; }

        public DbSet<Language> Language { get; set; }

        public DbSet<Skill> Skill { get; set; }

        public DbSet<TimeInterval> TimeInterval { get; set; }
        #endregion

        #region MyOpportunity
        #region Lookups
        public DbSet<MyOpportunity.Entities.Lookups.MyOpportunityAction> MyOpportunityAction { get; set; }

        public DbSet<MyOpportunity.Entities.Lookups.MyOpportunityVerificationStatus> MyOpportunityVerificationStatus { get; set; }
        #endregion Lookups

        public DbSet<MyOpportunity.Entities.MyOpportunity> MyOpportunity { get; set; }
        #endregion MyOpportunity

        #region Opportunity
        #region Lookups
        public DbSet<Opportunity.Entities.Lookups.OpportunityCategory> OpportunityCategory { get; set; }

        public DbSet<Opportunity.Entities.Lookups.OpportunityDifficulty> OpportunityDifficulty { get; set; }

        public DbSet<Opportunity.Entities.Lookups.OpportunityStatus> OpportunityStatus { get; set; }

        public DbSet<Opportunity.Entities.Lookups.OpportunityType> OpportunityType { get; set; }
        #endregion Lookups

        public DbSet<Opportunity.Entities.Opportunity> Opportunity { get; set; }

        public DbSet<OpportunityCategory> OpportunityCategories { get; set; }

        public DbSet<OpportunityCountry> OpportunityCountries { get; set; }

        public DbSet<OpportunityLanguage> OpportunityLanguages { get; set; }

        public DbSet<OpportunitySkill> OpportunitySkills { get; set; }
        #endregion Opportunity

        #endregion

        #region Protected Members
        protected override void OnModelCreating(ModelBuilder builder) { }
        #endregion
    }
}
