using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <inheritdoc />
  public partial class ApplicationDb_Payout : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
          name: "CashOutPoolCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "PayoutPoolCurrentFinancialYearInUsd");

      migrationBuilder.RenameColumn(
          name: "CashOutCumulativeInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "PayoutCumulativeInUsd");

      migrationBuilder.RenameColumn(
          name: "CashOutCumulativeCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "PayoutCumulativeCurrentFinancialYearInUsd");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.EnsureSchema(
          name: "Payout");

      migrationBuilder.AddColumn<Guid>(
          name: "PayoutTransactionId",
          schema: "Reward",
          table: "Transaction",
          type: "uuid",
          nullable: true);

      migrationBuilder.AddColumn<DateTimeOffset>(
          name: "ReservationExpiresAt",
          schema: "Reward",
          table: "Transaction",
          type: "timestamp with time zone",
          nullable: true);

      migrationBuilder.CreateTable(
          name: "TransactionStatus",
          schema: "Payout",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "varchar(30)", nullable: false),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Payout_TransactionStatus", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Transaction",
          schema: "Payout",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            UserId = table.Column<Guid>(type: "uuid", nullable: false),
            Type = table.Column<string>(type: "varchar(25)", nullable: false),
            Provider = table.Column<string>(type: "varchar(25)", nullable: false),
            StatusId = table.Column<Guid>(type: "uuid", nullable: false),
            Amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
            Currency = table.Column<string>(type: "varchar(10)", nullable: false),
            TransactionId = table.Column<string>(type: "varchar(50)", nullable: true),
            PaymentUrl = table.Column<string>(type: "varchar(2048)", nullable: true),
            ErrorReason = table.Column<string>(type: "text", nullable: true),
            ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            RewardReservationExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            DateLastReconciled = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            RetryCount = table.Column<byte>(type: "smallint", nullable: true),
            DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Payout_Transaction", x => x.Id);
            table.ForeignKey(
                      name: "FK_Transaction_TransactionStatus_StatusId",
                      column: x => x.StatusId,
                      principalSchema: "Payout",
                      principalTable: "TransactionStatus",
                      principalColumn: "Id");
            table.ForeignKey(
                      name: "FK_Transaction_User_UserId",
                      column: x => x.UserId,
                      principalSchema: "Entity",
                      principalTable: "User",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_PayoutTransactionId",
          schema: "Reward",
          table: "Transaction",
          column: "PayoutTransactionId");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction",
          columns: ["UserId", "SourceEntityType", "MyOpportunityId", "ReferralLinkUsageId", "PayoutTransactionId"],
          unique: true,
          filter: "\"Provider\" = 'ZLTO'")
          .Annotation("Npgsql:NullsDistinct", false);

      migrationBuilder.CreateIndex(
          name: "IX_Payout_Transaction_Provider_TransactionId",
          schema: "Payout",
          table: "Transaction",
          columns: ["Provider", "TransactionId"],
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Payout_Transaction_StatusId",
          schema: "Payout",
          table: "Transaction",
          column: "StatusId");

      migrationBuilder.CreateIndex(
          name: "IX_Payout_Transaction_UserId_StatusId_DateCreated_DateModified",
          schema: "Payout",
          table: "Transaction",
          columns: ["UserId", "StatusId", "DateCreated", "DateModified"]);

      migrationBuilder.CreateIndex(
          name: "IX_Payout_TransactionStatus_Name",
          schema: "Payout",
          table: "TransactionStatus",
          column: "Name",
          unique: true);

      migrationBuilder.AddForeignKey(
          name: "FK_Transaction_Transaction_PayoutTransactionId",
          schema: "Reward",
          table: "Transaction",
          column: "PayoutTransactionId",
          principalSchema: "Payout",
          principalTable: "Transaction",
          principalColumn: "Id");

      ApplicationDb_Payout_Seeding.Seed(migrationBuilder);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      ApplicationDb_Payout_Seeding.Unseed(migrationBuilder);

      migrationBuilder.DropForeignKey(
          name: "FK_Transaction_Transaction_PayoutTransactionId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropTable(
          name: "Transaction",
          schema: "Payout");

      migrationBuilder.DropTable(
          name: "TransactionStatus",
          schema: "Payout");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_PayoutTransactionId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropColumn(
          name: "PayoutTransactionId",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.DropColumn(
          name: "ReservationExpiresAt",
          schema: "Reward",
          table: "Transaction");

      migrationBuilder.CreateIndex(
          name: "IX_Transaction_UserId_SourceEntityType_MyOpportunityId_Referra~",
          schema: "Reward",
          table: "Transaction",
          columns: ["UserId", "SourceEntityType", "MyOpportunityId", "ReferralLinkUsageId"],
          unique: true,
          filter: "\"Provider\" = 'ZLTO'");

      migrationBuilder.RenameColumn(
          name: "PayoutPoolCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutPoolCurrentFinancialYearInUsd");

      migrationBuilder.RenameColumn(
          name: "PayoutCumulativeInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutCumulativeInUsd");

      migrationBuilder.RenameColumn(
          name: "PayoutCumulativeCurrentFinancialYearInUsd",
          schema: "Treasury",
          table: "Treasury",
          newName: "CashOutCumulativeCurrentFinancialYearInUsd");
    }
  }
}
