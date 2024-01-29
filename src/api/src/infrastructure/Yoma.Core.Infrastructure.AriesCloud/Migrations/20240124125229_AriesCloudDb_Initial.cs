using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yoma.Core.Infrastructure.AriesCloud.Migrations
{
    /// <inheritdoc />
    public partial class AriesCloudDb_Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "AriesCloud");

            migrationBuilder.CreateTable(
                name: "Connection",
                schema: "AriesCloud",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceTenantId = table.Column<string>(type: "varchar(50)", nullable: false),
                    TargetTenantId = table.Column<string>(type: "varchar(50)", nullable: false),
                    SourceConnectionId = table.Column<string>(type: "varchar(50)", nullable: false),
                    TargetConnectionId = table.Column<string>(type: "varchar(50)", nullable: false),
                    Protocol = table.Column<string>(type: "varchar(25)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Connection", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CredentialSchema",
                schema: "AriesCloud",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(125)", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    Version = table.Column<string>(type: "varchar(20)", nullable: false),
                    AttributeNames = table.Column<string>(type: "text", nullable: false),
                    ArtifactType = table.Column<string>(type: "varchar(20)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CredentialSchema", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Connection_SourceTenantId_TargetTenantId_Protocol",
                schema: "AriesCloud",
                table: "Connection",
                columns: new[] { "SourceTenantId", "TargetTenantId", "Protocol" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CredentialSchema_Name_ArtifactType",
                schema: "AriesCloud",
                table: "CredentialSchema",
                columns: new[] { "Name", "ArtifactType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Connection",
                schema: "AriesCloud");

            migrationBuilder.DropTable(
                name: "CredentialSchema",
                schema: "AriesCloud");
        }
    }
}
