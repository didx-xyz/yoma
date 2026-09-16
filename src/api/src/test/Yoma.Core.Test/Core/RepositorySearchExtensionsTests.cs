using Moq;
using System.Linq.Expressions;
using Xunit;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Test.Core
{
  public class RepositorySearchExtensionsTests
  {
    #region Tests
    [Fact]
    public void WhereContains_ReusesPredicateAndPreservesExistingFilter()
    {
      var repository = new Mock<IRepositoryValueContains<Item>>();
      repository.Setup(o => o.Contains(It.IsAny<Expression<Func<Item, bool>>>(), "match"))
        .Returns((Expression<Func<Item, bool>> predicate, string value) => predicate.Or(o => o.Name.Contains(value)));
      var items = new[]
      {
        new Item { Name = "match", Allowed = true },
        new Item { Name = "match", Allowed = false },
        new Item { Name = "different", Allowed = true }
      };

      var result = repository.Object.WhereContains(items.AsQueryable().Where(o => o.Allowed), "match").ToList();

      Assert.Same(items[0], Assert.Single(result));
      repository.Verify(o => o.Contains(It.IsAny<Expression<Func<Item, bool>>>(), "match"), Times.Once);
    }

    [Fact]
    public void WhereContains_StartsWithFalsePredicate()
    {
      var repository = new Mock<IRepositoryValueContains<Item>>();
      repository.Setup(o => o.Contains(It.IsAny<Expression<Func<Item, bool>>>(), It.IsAny<string>()))
        .Returns((Expression<Func<Item, bool>> predicate, string value) => predicate);

      var result = repository.Object.WhereContains(new[] { new Item() }.AsQueryable(), "%").ToList();

      Assert.Empty(result);
    }
    #endregion

    #region Helpers
    public sealed class Item
    {
      public string Name { get; init; } = string.Empty;

      public bool Allowed { get; init; }
    }
    #endregion
  }
}
