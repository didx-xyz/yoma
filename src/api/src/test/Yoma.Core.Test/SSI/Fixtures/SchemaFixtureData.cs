using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Test.SSI.Fixtures
{
  // Explicit mocked catalogue inputs, independent of database migrations and production seeds.
  internal static partial class SchemaFixtureData
  {
    internal static List<SSISchemaEntity> CreateEntities() => [User(), Organization(), Opportunity(), MyOpportunity()];
  }
}
