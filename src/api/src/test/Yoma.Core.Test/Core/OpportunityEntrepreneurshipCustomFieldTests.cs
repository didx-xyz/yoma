using FluentValidation;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.Database.Migrations;

namespace Yoma.Core.Test.Core
{
  public class OpportunityEntrepreneurshipCustomFieldTests
  {
    #region Tests
    [Fact]
    public void SeedsNewTypeAndSeparatesProgrammeFromVentureOutcomes()
    {
      var operations = new ApplicationDb_CF_Configuration().UpOperations;
      var type = Assert.Single(operations.OfType<InsertDataOperation>(), o => o.Table == "OpportunityType");
      Assert.Equal(Domain.Opportunity.Type.Entrepreneurship.ToString(), type.Values[0, 1]);
      Assert.Equal("Entrepreneurship", type.Values[0, 2]);

      var definitions = operations.OfType<InsertDataOperation>()
        .Where(o => o.Table == "CustomFieldDefinition" && o.Values[0, 0] is Guid id && id.ToString().StartsWith("cf0e0001"))
        .ToList();
      Assert.Equal(2, definitions.Count);

      var opportunity = Assert.Single(definitions, o => Equals(o.Values[0, Array.IndexOf(o.Columns, "EntityType")], CustomFieldEntityType.Opportunity.ToString()));
      Assert.Equal(3, opportunity.Values.GetLength(0));
      Assert.All(Enumerable.Range(0, 3), row =>
      {
        Assert.Equal(Domain.Opportunity.Type.Entrepreneurship.ToString(), Value(opportunity, row, "EntityContext"));
        Assert.False((bool)Value(opportunity, row, "IsRequired"));
      });

      var completion = Assert.Single(definitions, o => Equals(o.Values[0, Array.IndexOf(o.Columns, "EntityType")], CustomFieldEntityType.MyOpportunity.ToString()));
      Assert.Equal(12, completion.Values.GetLength(0));
      var required = Enumerable.Range(0, completion.Values.GetLength(0))
        .Where(row => (bool)Value(completion, row, "IsRequired"))
        .Select(row => (string)Value(completion, row, "Key"))
        .ToList();
      Assert.Equal(
        ["entrepreneurshipBusinessName", "entrepreneurshipBusinessSummary", "entrepreneurshipBusinessRegistered"],
        required);
      Assert.DoesNotContain(Enumerable.Range(0, completion.Values.GetLength(0)), row =>
        ((string)Value(completion, row, "Key")).Contains("Location", StringComparison.OrdinalIgnoreCase) &&
        (string)Value(completion, row, "Key") != "entrepreneurshipClientLocation");

      Assert.Contains(operations.OfType<SqlOperation>(), o => o.Sql.Contains("cf0b0001-0929-4cf0-a100-000000000012") &&
        o.Sql.Contains("cf0e0001-0929-4cf0-a100-000000000015"));
    }

    [Theory]
    [InlineData(null, null, true, true)]
    [InlineData("BeGreen", null, true, true)]
    [InlineData("Other", "New programme", true, true)]
    [InlineData("Other", null, true, false)]
    [InlineData(null, "New programme", true, false)]
    [InlineData("BeGreen", "New programme", true, false)]
    [InlineData(null, null, false, true)]
    [InlineData("Other", null, false, true)]
    [InlineData(null, "New programme", false, true)]
    [InlineData("BeGreen", null, false, true)]
    [InlineData("BeGreen", "New programme", false, false)]
    public void ProgrammeOtherCompanionsRespectManualAndExternalRequiredness(
      string? programme, string? description, bool enforceRequired, bool valid)
    {
      var fields = new List<CustomFieldValueItem>();
      if (programme != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.Entrepreneurship.Programme.Type,
          DataType = CustomFieldDataType.Option,
          ValueRaw = programme
        });

      if (description != null)
        fields.Add(new CustomFieldValueItem
        {
          Key = CustomFieldConstants.Entrepreneurship.Programme.OtherDescription,
          DataType = CustomFieldDataType.String,
          ValueRaw = description
        });

      var method = typeof(OpportunityService).GetMethod("AssertCrossFieldRules", BindingFlags.NonPublic | BindingFlags.Static)!;
      Exception? exception = null;
      try
      {
        method.Invoke(null, [new Domain.Opportunity.Models.Opportunity
        {
          Type = Domain.Opportunity.Type.Entrepreneurship,
          CustomFields = fields
        }, enforceRequired]);
      }
      catch (TargetInvocationException error) when (error.InnerException != null)
      {
        exception = error.InnerException;
      }

      if (valid) Assert.Null(exception);
      else Assert.IsType<ValidationException>(exception);
    }

    [Fact]
    public void RevenueAndFundingOptionsKeepPreRevenueAndInformalOutcomesRepresentable()
    {
      var options = new ApplicationDb_CF_Configuration().UpOperations.OfType<InsertDataOperation>()
        .Where(o => o.Table == "CustomFieldOption" && o.Values[0, 0] is Guid id && id.ToString().StartsWith("cf0e0001"))
        .ToList();
      Assert.Equal(2, options.Count);

      var completion = Assert.Single(options, o => Equals(o.Values[0, 0], new Guid("cf0e0001-0929-4cf0-a100-000000000201")));
      Assert.Contains(Enumerable.Range(0, completion.Values.GetLength(0)), row =>
        Value(completion, row, "Key").Equals("PreRevenue"));
      Assert.Contains(Enumerable.Range(0, completion.Values.GetLength(0)), row =>
        Value(completion, row, "Key").Equals("Grant"));
      Assert.Equal(6, Enumerable.Range(0, completion.Values.GetLength(0)).Count(row =>
        Value(completion, row, "CustomFieldDefinitionId").Equals(new Guid("cf0e0001-0929-4cf0-a100-000000000017"))));
    }

    [Fact]
    public void ManualVentureOutcomeMayOmitParticipationPeriod()
    {
      var validator = new MyOpportunityRequestValidatorVerify(Mock.Of<ITimeIntervalService>());
      var request = new MyOpportunityRequestVerify { DateEnd = DateTimeOffset.UtcNow };
      var context = new ValidationContext<MyOpportunityRequestVerify>(request);
      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Entrepreneurship;

      var errors = validator.Validate(context).Errors;
      Assert.DoesNotContain(errors, o => o.PropertyName == nameof(request.DateStart));
      Assert.DoesNotContain(errors, o => o.PropertyName == nameof(request.CommitmentInterval));

      request.CommitmentInterval = new MyOpportunityRequestVerifyCommitmentInterval
      {
        Id = Guid.Empty,
        Count = 0
      };
      errors = validator.Validate(context).Errors;
      Assert.Contains(errors, o => o.PropertyName == $"{nameof(request.CommitmentInterval)}.Id");
      Assert.Contains(errors, o => o.PropertyName == $"{nameof(request.CommitmentInterval)}.Count");

      request.CommitmentInterval = null;

      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Event;
      errors = validator.Validate(context).Errors;
      Assert.Contains(errors, o => o.PropertyName == nameof(request.DateStart));
    }
    #endregion

    #region Private Members
    private static object Value(InsertDataOperation operation, int row, string column)
    {
      return operation.Values[row, Array.IndexOf(operation.Columns, column)]!;
    }
    #endregion
  }
}
