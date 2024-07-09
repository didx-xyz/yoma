using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;
using Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.Opportunity.Entities;
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

    public DbSet<ActionLink.Entities.LinkUsageLog> LinkUsageLog { get; set; }
    #endregion ActionLink

    #region Core
    public DbSet<BlobObject> BlobObject { get; set; }
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
    public DbSet<TransactionStatus> TransactionStatus { get; set; }
    #endregion

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

      builder.Entity<SSITenantCreation>()
          .HasIndex(e => new { e.EntityType, e.UserId, e.OrganizationId })
          .IsUnique()
          .HasFilter(null);

      builder.Entity<SSICredentialIssuance>()
          .HasIndex(e => new { e.SchemaName, e.UserId, e.OrganizationId, e.MyOpportunityId })
          .IsUnique()
          .HasFilter(null);

      builder.Entity<Reward.Entities.RewardTransaction>()
        .HasIndex(e => new { e.UserId, e.SourceEntityType, e.MyOpportunityId })
        .IsUnique()
        .HasFilter(null);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder.AddInterceptors(new UtcSaveChangesInterceptor());
    }
    #endregion
  }
}
