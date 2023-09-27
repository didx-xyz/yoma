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
                name: "CredentialSchema",
                schema: "AriesCloud",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "varchar(125)", nullable: false),
                    Version = table.Column<string>(type: "varchar(20)", nullable: false),
                    AttributeNames = table.Column<string>(type: "nvarchar(MAX)", nullable: false),
                    ArtifactType = table.Column<string>(type: "varchar(20)", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CredentialSchema", x => x.Id);
                });

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
                name: "CredentialSchema",
                schema: "AriesCloud");
        }
    }
}
