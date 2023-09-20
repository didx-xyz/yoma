﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Yoma.Core.Infrastructure.AriesCloud.Context;

#nullable disable

namespace Yoma.Core.Infrastructure.AriesCloud.Migrations
{
    [DbContext(typeof(AriesCloudDbContext))]
    [Migration("20230920134529_AriesCloudDb_Initial")]
    partial class AriesCloudDb_Initial
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "7.0.11")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("Yoma.Core.Infrastructure.AriesCloud.Entities.InvitationCache", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTimeOffset>("DateStamp")
                        .HasColumnType("datetimeoffset");

                    b.Property<Guid>("InvitationId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("InvitationPayload")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<Guid>("SourceTenantId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("varchar(50)");

                    b.Property<Guid>("TargetTenantId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("ThreadId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Type")
                        .IsRequired()
                        .HasColumnType("varchar(50)");

                    b.HasKey("Id");

                    b.HasIndex("SourceTenantId", "TargetTenantId", "InvitationId", "Type", "Status", "ThreadId");

                    b.ToTable("InvitationCache", "ariescloud");
                });
#pragma warning restore 612, 618
        }
    }
}
