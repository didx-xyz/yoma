using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Referral_Program_And_Treasury : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(
          name: "IX_WalletCreation_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.EnsureSchema(
          name: "Treasury");

      migrationBuilder.RenameColumn(
          name: "ZltoRewardPool",
          schema: "Entity",
          table: "Organization",
          newName: "ZltoRewardPoolCurrentFinancialYear");

      migrationBuilder.RenameColumn(
          name: "YomaRewardPool",
          schema: "Entity",
          table: "Organization",
          newName: "YomaRewardPoolCurrentFinancialYear");

      migrationBuilder.AddColumn<string>(
          name: "Provider",
          schema: "Reward",
          table: "WalletCreation",
          type: "varchar(25)",
          nullable: false,
          defaultValue: "");

      migrationBuilder.AddColumn<string>(
          name: "Provider",
          schema: "Reward",
          table: "Transaction",
          type: "varchar(25)",
          nullable: false,
          defaultValue: "");

      migrationBuilder.AddColumn<bool>(
          name: "Hidden",
          schema: "Referral",
          table: "Program",
          type: "boolean",
          nullable: true);

      migrationBuilder.AddColumn<int>(
          name: "ReferrerLimit",
          schema: "Referral",
          table: "Program",
          type: "integer",
          nullable: true);

      migrationBuilder.AddColumn<int>(
          name: "ReferrerTotal",
          schema: "Referral",
          table: "Program",
          type: "integer",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "ZltoRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.AddColumn<decimal>(
          name: "YomaRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          type: "numeric(12,2)",
          nullable: true);

      migrationBuilder.CreateTable(
          name: "Treasury",
          schema: "Treasury",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            FinancialYearStartMonth = table.Column<byte>(type: "smallint", nullable: false),
            FinancialYearStartDay = table.Column<byte>(type: "smallint", nullable: false),
            ZltoRewardPoolCurrentFinancialYear = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ZltoRewardCumulative = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ZltoRewardCumulativeCurrentFinancialYear = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ChimoneyPoolCurrentFinancialYearInUSD = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ChimoneyCumulativeInUSD = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ChimoneyCumulativeCurrentFinancialYearInUSD = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
            ConversionRateZltoUsd = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            ModifiedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Treasury", x => x.Id);
            table.ForeignKey(
                name: "FK_Treasury_User_CreatedByUserId",
                column: x => x.CreatedByUserId,
                principalSchema: "Entity",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
            table.ForeignKey(
                name: "FK_Treasury_User_ModifiedByUserId",
                column: x => x.ModifiedByUserId,
                principalSchema: "Entity",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
          });

      migrationBuilder.CreateIndex(
          name: "IX_WalletCreation_Provider_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "WalletCreation",
          columns: ["Provider", "StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_WalletCreation_StatusId",
          schema: "Reward",
          table: "WalletCreation",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_Provider_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "Transaction",
          columns: ["Provider", "StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_StatusId",
          schema: "Reward",
          table: "Transaction",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction",
          columns: ["UserId", "SourceEntityType", "MyOpportunityId", "ReferralLinkUsageId"],
          unique: true,
          filter: "\"Provider\" = 'ZLTO'");

      migrationBuilder.CreateIndex(
          name: "IX_Treasury_CreatedByUserId",
          schema: "Treasury",
          table: "Treasury",
          column: "CreatedByUserId");

      migrationBuilder.CreateIndex(
          name: "IX_Treasury_DateCreated_DateModified",
          schema: "Treasury",
          table: "Treasury",
          columns: ["DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Treasury_ModifiedByUserId",
          schema: "Treasury",
          table: "Treasury",
          column: "ModifiedByUserId");


      Referral_Program_And_Treasury_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "Treasury",
          schema: "Treasury");

      migrationBuilder.DropIndex(
          name: "IX_WalletCreation_Provider_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropIndex(
          name: "IX_WalletCreation_StatusId",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_Provider_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_StatusId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropColumn(
          name: "Provider",
          schema: "Reward",
          table: "WalletCreation");

      migrationBuilder.DropColumn(
          name: "Provider",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropColumn(
          name: "Hidden",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropColumn(
          name: "ReferrerLimit",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropColumn(
          name: "ReferrerTotal",
          schema: "Referral",
          table: "Program");

      migrationBuilder.DropColumn(
          name: "ZltoRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.DropColumn(
          name: "YomaRewardCumulativeCurrentFinancialYear",
          schema: "Entity",
          table: "Organization");

      migrationBuilder.RenameColumn(
          name: "ZltoRewardPoolCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          newName: "ZltoRewardPool");

      migrationBuilder.RenameColumn(
          name: "YomaRewardPoolCurrentFinancialYear",
          schema: "Entity",
          table: "Organization",
          newName: "YomaRewardPool");

      migrationBuilder.CreateIndex(
          name: "IX_WalletCreation_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "WalletCreation",
          columns: ["StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_StatusId_DateCreated_DateModified",
          schema: "Reward",
          table: "Transaction",
          columns: ["StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction",
          columns: ["UserId", "SourceEntityType", "MyOpportunityId", "ReferralLinkUsageId"],
          unique: true);
    }
  }
}
