using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Database.ActionLink.Entities;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.Reward.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.SSI.Entities;
using Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Converters;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Infrastructure.Database.Context
{
  public class ApplicationDbContext : DbContext
  {
    #region Constructors
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    #endregion

    #region Public Members
    #region ActionLink
    #region Lookups
    public DbSet<ActionLink.Entities.Lookups.LinkStatus> LinkStatus { get; set; }
    #endregion Lookups

    public DbSet<ActionLink.Entities.Link> Link { get; set; }

    public DbSet<LinkUsageLog> LinkUsageLog { get; set; }
    #endregion ActionLink

    #region Core
    #region Lookups
    public DbSet<Core.Entities.Lookups.DownloadScheduleStatus> DownloadScheduleStatus { get; set; }
    #endregion Lookups

    public DbSet<BlobObject> BlobObject { get; set; }

    public DbSet<DownloadSchedule> DownloadSchedule { get; set; }
    #endregion Core

    #region Entity
    #region Lookups
    public DbSet<Entity.Entities.Lookups.OrganizationStatus> OrganizationStatus { get; set; }

    public DbSet<Entity.Entities.Lookups.OrganizationProviderType> OrganizationProviderType { get; set; }

    public DbSet<Entity.Entities.Lookups.SettingsDefinition> SettingsDefinition { get; set; }
    #endregion Lookups

    public DbSet<Organization> Organization { get; set; }

    public DbSet<OrganizationDocument> OrganizationDocuments { get; set; }

    public DbSet<OrganizationProviderType> OrganizationProviderTypes { get; set; }

    public DbSet<OrganizationUser> OrganizationUsers { get; set; }

    public DbSet<User> User { get; set; }

    public DbSet<UserLoginHistory> UserLoginHistory { get; set; }

    public DbSet<UserSkill> UserSkills { get; set; }

    public DbSet<UserSkillOrganization> UserSkillOrganizations { get; set; }
    #endregion Entity

    #region Lookups
    public DbSet<Country> Country { get; set; }

    public DbSet<Education> Education { get; set; }

    public DbSet<EngagementType> EngagementType { get; set; }

    public DbSet<Gender> Gender { get; set; }

    public DbSet<Language> Language { get; set; }

    public DbSet<Skill> Skill { get; set; }

    public DbSet<TimeInterval> TimeInterval { get; set; }
    #endregion

    #region Marketplace
    #region Lookups
    public DbSet<StoreAccessControlRuleStatus> StoreAccessControlRuleStatus { get; set; }

    public DbSet<TransactionStatus> TransactionStatus { get; set; }
    #endregion

    public DbSet<Marketplace.Entities.StoreAccessControlRuleOpportunity> StoreAccessControlRuleOpportunities { get; set; }

    public DbSet<Marketplace.Entities.StoreAccessControlRule> StoreAccessControlRule { get; set; }

    public DbSet<Marketplace.Entities.TransactionLog> TransactionLog { get; set; }

    #endregion Marketplace

    #region MyOpportunity
    #region Lookups
    public DbSet<MyOpportunity.Entities.Lookups.MyOpportunityAction> MyOpportunityAction { get; set; }

    public DbSet<MyOpportunity.Entities.Lookups.MyOpportunityVerificationStatus> MyOpportunityVerificationStatus { get; set; }
    #endregion Lookups

    public DbSet<MyOpportunity.Entities.MyOpportunity> MyOpportunity { get; set; }

    public DbSet<MyOpportunity.Entities.MyOpportunityVerification> MyOpportunityVerifications { get; set; }
    #endregion MyOpportunity

    #region Opportunity
    #region Lookups
    public DbSet<Opportunity.Entities.Lookups.OpportunityCategory> OpportunityCategory { get; set; }

    public DbSet<Opportunity.Entities.Lookups.OpportunityDifficulty> OpportunityDifficulty { get; set; }

    public DbSet<Opportunity.Entities.Lookups.OpportunityStatus> OpportunityStatus { get; set; }

    public DbSet<Opportunity.Entities.Lookups.OpportunityType> OpportunityType { get; set; }

    public DbSet<Opportunity.Entities.Lookups.OpportunityVerificationType> OpportunityVerificationType { get; set; }
    #endregion Lookups

    public DbSet<Opportunity.Entities.Opportunity> Opportunity { get; set; }

    public DbSet<OpportunityCategory> OpportunityCategories { get; set; }

    public DbSet<OpportunityCountry> OpportunityCountries { get; set; }

    public DbSet<OpportunityLanguage> OpportunityLanguages { get; set; }

    public DbSet<OpportunitySkill> OpportunitySkills { get; set; }

    public DbSet<OpportunityVerificationType> OpportunityVerificationTypes { get; set; }
    #endregion Opportunity

    #region PartnerSharing
    #region Lookups
    public DbSet<PartnerSharing.Entities.Lookups.Partner> PartnerSharingPartner { get; set; }
    public DbSet<PartnerSharing.Entities.Lookups.ProcessingStatus> PartnerSharingProcessingStatus { get; set; }
    #endregion Lookups 

    public DbSet<PartnerSharing.Entities.ProcessingLog> PartnerSharingProcessingLog { get; set; }
    #endregion PartnerSharing

    #region Referral
    #region Lookups
    public DbSet<BlockReason> ReferralBlockReason { get; set; }

    public DbSet<LinkStatus> ReferralLinkStatus { get; set; }

    public DbSet<LinkUsageStatus> ReferralLinkUsageStatus { get; set; }

    public DbSet<ProgramStatus> ReferralProgramStatus { get; set; }
    #endregion Lookups

    public DbSet<Block> ReferralBlock { get; set; }

    public DbSet<Referral.Entities.Link> ReferralLink { get; set; }

    public DbSet<LinkUsage> ReferralLinkUsage { get; set; }

    public DbSet<Program> ReferralProgram { get; set; }

    public DbSet<ProgramPathway> ReferralProgramPathway { get; set; }

    public DbSet<ProgramPathwayStep> ReferralProgramPathwayStep { get; set; }

    public DbSet<ProgramPathwayTask> ReferralProgramPathwayTask { get; set; }
    #endregion Referral

    #region Reward
    #region Lookups
    public DbSet<RewardTransactionStatus> RewardTransactionStatus { get; set; }

    public DbSet<WalletCreationStatus> WalletCreationStatus { get; set; }
    #endregion Lookups

    public DbSet<Reward.Entities.RewardTransaction> RewardTransaction { get; set; }

    public DbSet<Reward.Entities.WalletCreation> WalletCreation { get; set; }
    #endregion

    #region SSI
    #region Lookups
    public DbSet<SSICredentialIssuanceStatus> SSICredentialIssuanceStatus { get; set; }

    public DbSet<SSISchemaEntity> SSISchemaEntity { get; set; }

    public DbSet<SSISchemaEntityType> SSISchemaEntityTypes { get; set; }

    public DbSet<SSISchemaEntityProperty> SSISchemaEntityProperties { get; set; }

    public DbSet<SSISchemaType> SSISchemaType { get; set; }

    public DbSet<SSITenantCreationStatus> SSITenantCreationStatus { get; set; }
    #endregion Lookups

    public DbSet<SSICredentialIssuance> SSICredentialIssuance { get; set; }

    public DbSet<SSITenantCreation> SSITenantCreation { get; set; }
    #endregion SSI

    #endregion

    #region Protected Members
    protected override void OnModelCreating(ModelBuilder builder)
    {
      builder.Entity<Domain.Core.Models.UnnestedValue>(eb =>
      {
        eb.HasKey(x => x.Id); // keep the key for joins and EF tracking
        eb.ToTable("UnnestedValueDummy"); // dummy name to stop EF writing null
        eb.ToView("unnested_values"); // mark it as not having a backing table or view
        eb.Metadata.SetIsTableExcludedFromMigrations(true); // exclude from migrations
      });

      foreach (var entityType in builder.Model.GetEntityTypes())
      {
        foreach (var property in entityType.GetProperties())
        {
          if (property.ClrType == typeof(DateTimeOffset))
          {
            var entityTypeBuilder = builder.Entity(entityType.ClrType);
            var propertyBuilder = entityTypeBuilder.Property(property.ClrType, property.Name);
            propertyBuilder.HasConversion(new UtcDateTimeOffsetConverter());
          }
        }
      }

      #region ActionLink
      builder.Entity<ActionLink.Entities.Link>()
          .HasOne(o => o.CreatedByUser)
          .WithMany()
          .HasForeignKey(o => o.CreatedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<ActionLink.Entities.Link>()
          .HasOne(o => o.ModifiedByUser)
          .WithMany()
          .HasForeignKey(o => o.ModifiedByUserId)
          .OnDelete(DeleteBehavior.NoAction);
      #endregion

      #region Entity
      builder.Entity<Organization>()
          .HasOne(o => o.CreatedByUser)
          .WithMany()
          .HasForeignKey(o => o.CreatedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Organization>()
          .HasOne(o => o.ModifiedByUser)
          .WithMany()
          .HasForeignKey(o => o.ModifiedByUserId)
          .OnDelete(DeleteBehavior.NoAction);
      #endregion

      #region Opportunity
      builder.Entity<Opportunity.Entities.Opportunity>()
          .HasIndex(o => new { o.Description })
          .HasMethod("GIN")
          .IsTsVectorExpressionIndex("english");

      builder.Entity<Opportunity.Entities.Opportunity>()
          .HasOne(o => o.CreatedByUser)
          .WithMany()
          .HasForeignKey(o => o.CreatedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Opportunity.Entities.Opportunity>()
          .HasOne(o => o.ModifiedByUser)
          .WithMany()
          .HasForeignKey(o => o.ModifiedByUserId)
          .OnDelete(DeleteBehavior.NoAction);
      #endregion Opportunity

      #region Referral
      builder.Entity<Block>()
          .HasOne(b => b.User)
          .WithMany(u => u.Blocks)
          .HasForeignKey(b => b.UserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Block>()
          .HasOne(b => b.CreatedByUser)
          .WithMany()
          .HasForeignKey(b => b.CreatedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Block>()
          .HasOne(b => b.ModifiedByUser)
          .WithMany()
          .HasForeignKey(b => b.ModifiedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Block>().HasIndex(o => o.UserId)
          .IsUnique()
          .HasFilter($"\"{nameof(Block.Active)}\" = true");

      builder.Entity<Program>()
          .HasOne(o => o.CreatedByUser)
          .WithMany()
          .HasForeignKey(o => o.CreatedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Program>()
          .HasOne(o => o.ModifiedByUser)
          .WithMany()
          .HasForeignKey(o => o.ModifiedByUserId)
          .OnDelete(DeleteBehavior.NoAction);

      builder.Entity<Program>()
          .HasIndex(o => o.IsDefault)
          .IsUnique()
          .HasFilter($"\"{nameof(Program.IsDefault)}\" = true");

      builder.Entity<ProgramPathwayTask>()
          .HasIndex(e => new { e.StepId, e.EntityType, e.OpportunityId })
          .IsUnique()
          .HasFilter(null);
      #endregion

      #region Reward
      builder.Entity<Reward.Entities.RewardTransaction>()
          .HasIndex(e => new { e.UserId, e.SourceEntityType, e.MyOpportunityId, e.ReferralLinkUsageId })
          .IsUnique()
          .HasFilter(null);
      #endregion Reward

      #region SSI
      builder.Entity<SSITenantCreation>()
          .HasIndex(e => new { e.EntityType, e.UserId, e.OrganizationId })
          .IsUnique()
          .HasFilter(null);

      builder.Entity<SSICredentialIssuance>()
          .HasIndex(e => new { e.SchemaName, e.UserId, e.OrganizationId, e.MyOpportunityId })
          .IsUnique()
          .HasFilter(null);
      #endregion
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder.AddInterceptors(new UtcSaveChangesInterceptor(), new EmptyStringToNullInterceptor());
    }
    #endregion
  }
}
