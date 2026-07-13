using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_Custom_Fields_Seeding
  {
    private const string TemporaryDescription = "TODO(YOM-1244): Temporary development field; replace with the BA-approved definition.";

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      // TODO(YOM-1244): Replace this complete development seed set with BA-approved definitions and options before release.
      var dateCreated = DateTimeOffset.UtcNow;

      migrationBuilder.InsertData(
        table: "CustomFieldDefinition",
        schema: "Core",
        columns:
        [
          "Id", "EntityType", "EntityContext", "Key", "Title", "Description", "Group", "SubGroup", "DataType",
          "ValidationRegex", "ValidationErrorMessage", "IsRequired", "SupportsMultiple", "SortOrder", "IsActive", "IsSystem",
          "DateCreated", "DateModified"
        ],
        values: new object?[,]
        {
          // Opportunity: generic fall-through fields covering every supported data type.
          { "A1000000-0000-4000-8000-000000000001", "Opportunity", null, "sampleAudienceDescription", "[Sample] Audience Description", TemporaryDescription, "[Sample] General", "Basics", "String", "^.{3,200}$", "Audience description must be between 3 and 200 characters.", false, null, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000002", "Opportunity", null, "sampleAvailablePlaces", "[Sample] Available Places", TemporaryDescription, "[Sample] General", "Capacity", "Integer", null, null, false, null, 20, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000003", "Opportunity", null, "sampleEstimatedValue", "[Sample] Estimated Value", TemporaryDescription, "[Sample] General", "Value", "Decimal", null, null, false, null, 30, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000004", "Opportunity", null, "sampleApplicationRequired", "[Sample] Application Required", TemporaryDescription, "[Sample] General", "Application", "Boolean", null, null, false, null, 40, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000005", "Opportunity", null, "sampleApplicationDeadline", "[Sample] Application Deadline", TemporaryDescription, "[Sample] General", "Application", "DateTime", null, null, false, null, 50, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000006", "Opportunity", null, "sampleDeliveryMode", "[Sample] Delivery Mode", TemporaryDescription, "[Sample] General", "Delivery", "Option", null, null, false, false, 60, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000007", "Opportunity", null, "sampleParticipationBenefits", "[Sample] Participation Benefits", TemporaryDescription, "[Sample] General", "Benefits", "Option", null, null, false, true, 70, true, false, dateCreated, dateCreated },

          // Opportunity: Job examples based on the directional ticket fields.
          { "A1000000-0000-4000-8000-000000000008", "Opportunity", "Job", "jobWorkType", "[Sample] Work Type", TemporaryDescription, "[Sample] Job Details", "Employment", "Option", null, null, true, false, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000009", "Opportunity", "Job", "jobSalary", "[Sample] Salary", TemporaryDescription, "[Sample] Job Details", "Compensation", "Decimal", null, null, false, null, 20, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000010", "Opportunity", "Job", "jobMinimumQualification", "[Sample] Minimum Qualification", TemporaryDescription, "[Sample] Job Details", "Requirements", "Option", null, null, false, false, 30, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000011", "Opportunity", "Job", "jobExperienceLevel", "[Sample] Experience Level", TemporaryDescription, "[Sample] Job Details", "Requirements", "Option", null, null, false, false, 40, true, false, dateCreated, dateCreated },

          // Opportunity: Learning.
          { "A1000000-0000-4000-8000-000000000012", "Opportunity", "Learning", "learningDeliveryFormat", "[Sample] Learning Format", TemporaryDescription, "[Sample] Learning Details", "Delivery", "Option", null, null, false, false, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000013", "Opportunity", "Learning", "learningCertificateProvided", "[Sample] Certificate Provided", TemporaryDescription, "[Sample] Learning Details", "Outcome", "Boolean", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // Opportunity: Event.
          { "A1000000-0000-4000-8000-000000000014", "Opportunity", "Event", "eventVenueName", "[Sample] Venue Name", TemporaryDescription, "[Sample] Event Details", "Venue", "String", null, null, false, null, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000015", "Opportunity", "Event", "eventRegistrationDeadline", "[Sample] Registration Deadline", TemporaryDescription, "[Sample] Event Details", "Registration", "DateTime", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // Opportunity: Task.
          { "A1000000-0000-4000-8000-000000000016", "Opportunity", "Task", "taskEstimatedMinutes", "[Sample] Estimated Minutes", TemporaryDescription, "[Sample] Task Details", "Effort", "Integer", null, null, false, null, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000017", "Opportunity", "Task", "taskParticipationMode", "[Sample] Participation Mode", TemporaryDescription, "[Sample] Task Details", "Participation", "Option", null, null, false, false, 20, true, false, dateCreated, dateCreated },

          // Opportunity: Other.
          { "A1000000-0000-4000-8000-000000000018", "Opportunity", "Other", "otherOpportunityLabel", "[Sample] Opportunity Label", TemporaryDescription, "[Sample] Other Details", "Classification", "String", null, null, false, null, 10, true, false, dateCreated, dateCreated },
          { "A1000000-0000-4000-8000-000000000019", "Opportunity", "Other", "otherReferenceValue", "[Sample] Reference Value", TemporaryDescription, "[Sample] Other Details", "Value", "Decimal", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // MyOpportunity: generic completion fields covering every supported data type.
          { "B1000000-0000-4000-8000-000000000001", "MyOpportunity", null, "completionReflection", "[Sample] Completion Reflection", TemporaryDescription, "[Sample] Completion", "Reflection", "String", "^.{3,500}$", "Completion reflection must be between 3 and 500 characters.", false, null, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000002", "MyOpportunity", null, "completionHoursSpent", "[Sample] Hours Spent", TemporaryDescription, "[Sample] Completion", "Effort", "Integer", null, null, false, null, 20, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000003", "MyOpportunity", null, "completionScore", "[Sample] Completion Score", TemporaryDescription, "[Sample] Completion", "Outcome", "Decimal", null, null, false, null, 30, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000004", "MyOpportunity", null, "completionWouldRecommend", "[Sample] Would Recommend", TemporaryDescription, "[Sample] Completion", "Feedback", "Boolean", null, null, false, null, 40, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000005", "MyOpportunity", null, "completionAchievedAt", "[Sample] Achievement Date", TemporaryDescription, "[Sample] Completion", "Outcome", "DateTime", null, null, false, null, 50, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000006", "MyOpportunity", null, "completionOutcome", "[Sample] Completion Outcome", TemporaryDescription, "[Sample] Completion", "Outcome", "Option", null, null, false, false, 60, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000007", "MyOpportunity", null, "completionHighlights", "[Sample] Completion Highlights", TemporaryDescription, "[Sample] Completion", "Highlights", "Option", null, null, false, true, 70, true, false, dateCreated, dateCreated },

          // MyOpportunity: Job completion examples.
          { "B1000000-0000-4000-8000-000000000008", "MyOpportunity", "Job", "jobPlacementStatus", "[Sample] Placement Status", TemporaryDescription, "[Sample] Job Completion", "Placement", "Option", null, null, true, false, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000009", "MyOpportunity", "Job", "jobProbationCompleted", "[Sample] Probation Completed", TemporaryDescription, "[Sample] Job Completion", "Placement", "Boolean", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // MyOpportunity: Learning completion examples.
          { "B1000000-0000-4000-8000-000000000010", "MyOpportunity", "Learning", "learningAssessmentScore", "[Sample] Assessment Score", TemporaryDescription, "[Sample] Learning Completion", "Assessment", "Decimal", null, null, false, null, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000011", "MyOpportunity", "Learning", "learningCredentialReceived", "[Sample] Credential Received", TemporaryDescription, "[Sample] Learning Completion", "Outcome", "Boolean", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // MyOpportunity: Event completion examples.
          { "B1000000-0000-4000-8000-000000000012", "MyOpportunity", "Event", "eventRole", "[Sample] Event Role", TemporaryDescription, "[Sample] Event Completion", "Participation", "Option", null, null, false, false, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000013", "MyOpportunity", "Event", "eventAttendanceDate", "[Sample] Attendance Date", TemporaryDescription, "[Sample] Event Completion", "Participation", "DateTime", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // MyOpportunity: Task completion examples.
          { "B1000000-0000-4000-8000-000000000014", "MyOpportunity", "Task", "taskEvidenceReference", "[Sample] Evidence Reference", TemporaryDescription, "[Sample] Task Completion", "Evidence", "String", "^[A-Za-z0-9_-]{3,50}$", "Evidence reference must contain 3 to 50 letters, numbers, underscores or hyphens.", false, null, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000015", "MyOpportunity", "Task", "taskAttemptCount", "[Sample] Attempt Count", TemporaryDescription, "[Sample] Task Completion", "Effort", "Integer", null, null, false, null, 20, true, false, dateCreated, dateCreated },

          // MyOpportunity: Other completion examples.
          { "B1000000-0000-4000-8000-000000000016", "MyOpportunity", "Other", "otherCompletionNote", "[Sample] Completion Note", TemporaryDescription, "[Sample] Other Completion", "Details", "String", null, null, false, null, 10, true, false, dateCreated, dateCreated },
          { "B1000000-0000-4000-8000-000000000017", "MyOpportunity", "Other", "otherCompletionConfirmed", "[Sample] Completion Confirmed", TemporaryDescription, "[Sample] Other Completion", "Details", "Boolean", null, null, false, null, 20, true, false, dateCreated, dateCreated }
        });

      migrationBuilder.InsertData(
        table: "CustomFieldOption",
        schema: "Core",
        columns: ["Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder", "IsActive", "DateCreated", "DateModified"],
        values: new object[,]
        {
          // Opportunity: generic options.
          { "C1000000-0000-4000-8000-000000000001", "A1000000-0000-4000-8000-000000000006", "online", "Online", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000002", "A1000000-0000-4000-8000-000000000006", "inPerson", "In Person", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000003", "A1000000-0000-4000-8000-000000000006", "hybrid", "Hybrid", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000004", "A1000000-0000-4000-8000-000000000007", "certificate", "Certificate", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000005", "A1000000-0000-4000-8000-000000000007", "mentoring", "Mentoring", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000006", "A1000000-0000-4000-8000-000000000007", "networking", "Networking", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000007", "A1000000-0000-4000-8000-000000000007", "transportSupport", "Transport Support", 40, true, dateCreated, dateCreated },

          // Opportunity: Job options.
          { "C1000000-0000-4000-8000-000000000008", "A1000000-0000-4000-8000-000000000008", "onsite", "On-site", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000009", "A1000000-0000-4000-8000-000000000008", "remote", "Remote", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000010", "A1000000-0000-4000-8000-000000000008", "hybrid", "Hybrid", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000011", "A1000000-0000-4000-8000-000000000008", "flexible", "Flexible", 40, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000012", "A1000000-0000-4000-8000-000000000010", "none", "No Formal Qualification", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000013", "A1000000-0000-4000-8000-000000000010", "secondary", "Secondary Education", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000014", "A1000000-0000-4000-8000-000000000010", "diploma", "Diploma", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000015", "A1000000-0000-4000-8000-000000000010", "degree", "Degree", 40, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000016", "A1000000-0000-4000-8000-000000000011", "entry", "Entry Level", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000017", "A1000000-0000-4000-8000-000000000011", "junior", "Junior", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000018", "A1000000-0000-4000-8000-000000000011", "mid", "Mid-level", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000019", "A1000000-0000-4000-8000-000000000011", "senior", "Senior", 40, true, dateCreated, dateCreated },

          // Opportunity: Learning and Task options.
          { "C1000000-0000-4000-8000-000000000020", "A1000000-0000-4000-8000-000000000012", "selfPaced", "Self-paced", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000021", "A1000000-0000-4000-8000-000000000012", "facilitated", "Facilitated", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000022", "A1000000-0000-4000-8000-000000000012", "blended", "Blended", 30, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000023", "A1000000-0000-4000-8000-000000000017", "individual", "Individual", 10, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000024", "A1000000-0000-4000-8000-000000000017", "pair", "Pair", 20, true, dateCreated, dateCreated },
          { "C1000000-0000-4000-8000-000000000025", "A1000000-0000-4000-8000-000000000017", "team", "Team", 30, true, dateCreated, dateCreated },

          // MyOpportunity: generic options.
          { "D1000000-0000-4000-8000-000000000001", "B1000000-0000-4000-8000-000000000006", "completed", "Completed", 10, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000002", "B1000000-0000-4000-8000-000000000006", "partiallyCompleted", "Partially Completed", 20, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000003", "B1000000-0000-4000-8000-000000000006", "notCompleted", "Not Completed", 30, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000004", "B1000000-0000-4000-8000-000000000007", "learnedSomethingNew", "Learned Something New", 10, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000005", "B1000000-0000-4000-8000-000000000007", "builtPortfolioItem", "Built a Portfolio Item", 20, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000006", "B1000000-0000-4000-8000-000000000007", "expandedNetwork", "Expanded My Network", 30, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000007", "B1000000-0000-4000-8000-000000000007", "receivedRecognition", "Received Recognition", 40, true, dateCreated, dateCreated },

          // MyOpportunity: Job and Event options.
          { "D1000000-0000-4000-8000-000000000008", "B1000000-0000-4000-8000-000000000008", "placed", "Placed", 10, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000009", "B1000000-0000-4000-8000-000000000008", "pending", "Pending", 20, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000010", "B1000000-0000-4000-8000-000000000008", "notPlaced", "Not Placed", 30, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000011", "B1000000-0000-4000-8000-000000000012", "attendee", "Attendee", 10, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000012", "B1000000-0000-4000-8000-000000000012", "volunteer", "Volunteer", 20, true, dateCreated, dateCreated },
          { "D1000000-0000-4000-8000-000000000013", "B1000000-0000-4000-8000-000000000012", "speaker", "Speaker", 30, true, dateCreated, dateCreated }
        });
    }
  }
}
