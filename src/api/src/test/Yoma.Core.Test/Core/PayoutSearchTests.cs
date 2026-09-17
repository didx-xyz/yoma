using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Payout.Repositories;
using UserEntity = Yoma.Core.Infrastructure.Database.Entity.Entities.User;
using PayoutEntity = Yoma.Core.Infrastructure.Database.Payout.Entities.PayoutTransaction;

namespace Yoma.Core.Test.Core
{
  public class PayoutSearchTests
  {
    [Theory]
    [InlineData("match")]
    [InlineData("MATCH")]
    [InlineData("%")]
    [InlineData("_")]
    [InlineData("\\")]
    [InlineData("phone")]
    [InlineData("no-match")]
    [InlineData("00000000-0000-0000-0000-000000000001")]
    [InlineData("00000000-0000-0000-0000-000000000011")]
    public void MatchingIds_PreservesOriginalPredicateCountsAndPages(string value)
    {
      using var context = CreateContext();
      var users = new[]
      {
        new UserEntity { Id = Id(1), Email = "MATCH@example", DisplayName = "other", PhoneNumber = "phone" },
        new UserEntity { Id = Id(2), Email = null, DisplayName = null, PhoneNumber = "MATCH-phone" },
        new UserEntity { Id = Id(3), Email = "other", DisplayName = "MATCH%_\\", PhoneNumber = null },
        new UserEntity { Id = Id(4), Email = null, DisplayName = null, PhoneNumber = null },
        new UserEntity { Id = Id(5), Email = "", DisplayName = "", PhoneNumber = "phone" }
      };
      var entities = users.Select((user, i) => new PayoutEntity
      {
        Id = Id(11 + i),
        UserId = user.Id,
        User = user,
        TransactionId = i == 3 ? "MATCH%_\\" : null,
        ErrorReason = i == 4 ? "MATCH%_\\" : null,
        Amount = i + 1
      }).ToArray();
      context.User = Set(users);
      context.PayoutTransaction = Set(entities);
      var items = entities.Select(o => new PayoutTransaction
      {
        Id = o.Id,
        UserId = o.UserId,
        Amount = o.Amount,
        Username = o.User.Email ?? o.User.PhoneNumber ?? string.Empty,
        UserEmail = o.User.Email,
        UserPhoneNumber = o.User.PhoneNumber,
        UserDisplayName = o.User.DisplayName ?? o.User.Email ?? o.User.PhoneNumber ?? string.Empty,
        TransactionId = o.TransactionId,
        ErrorReason = o.ErrorReason
      }).AsQueryable();
      var repository = new PayoutTransactionRepository(context);
      var lower = value.ToLower();
      var id = Guid.TryParse(value, out var parsed) ? parsed : (Guid?)null;
#pragma warning disable CA1862
      var original = items.Where(o =>
        (id.HasValue && (o.Id == id.Value || o.UserId == id.Value)) ||
        (o.Username != null && o.Username.ToLower().Contains(lower)) ||
        (o.UserEmail != null && o.UserEmail.ToLower().Contains(lower)) ||
        (o.UserPhoneNumber != null && o.UserPhoneNumber.ToLower().Contains(lower)) ||
        (o.UserDisplayName != null && o.UserDisplayName.ToLower().Contains(lower)) ||
        (o.TransactionId != null && o.TransactionId.ToLower().Contains(lower)) ||
        (o.ErrorReason != null && o.ErrorReason.ToLower().Contains(lower)));
#pragma warning restore CA1862
      // Existing root filters must remain ANDed with matching IDs.
      var expected = original.Where(o => o.Amount >= 2).OrderBy(o => o.Id);
      var actual = repository.Contains(items.Where(o => o.Amount >= 2), value).OrderBy(o => o.Id);
      Assert.Equal(expected.Select(o => o.Id), actual.Select(o => o.Id));
      Assert.Equal(expected.Count(), actual.Count());
      for (var page = 1; page <= 3; page++)
      {
        var filter = new PaginationFilter { PageNumber = page, PageSize = 2 };
        Assert.Equal(expected.Skip((page - 1) * 2).Take(2).Select(o => o.Id), actual.Page(filter).Select(o => o.Id));
      }
      var predicate = repository.Contains(o => o.Amount == 1, value);
      Assert.Equal(items.Where(o => o.Amount == 1).Select(o => o.Id).Union(original.Select(o => o.Id)).Order(),
        items.Where(predicate).Select(o => o.Id).Order());
    }

    [Fact]
    public void Search_TranslatesToDeferredUnionAndLiteralLikeWithoutConnecting()
    {
      using var context = CreateContext();
      var repository = new PayoutTransactionRepository(context);
      var sql = repository.Contains(repository.Query().Where(o => o.Amount >= 2), "%_\\")
        .OrderByDescending(o => o.DateCreated).ThenByDescending(o => o.Id)
        .Page(new PaginationFilter { PageNumber = 2, PageSize = 12 }).ToQueryString();
      Assert.Contains("UNION", sql);
      Assert.Contains("lower(", sql);
      Assert.Contains("LIKE", sql);
      Assert.DoesNotContain("ILIKE", sql);
      Assert.Contains("LIMIT", sql);
      Assert.Contains("OFFSET", sql);
      Assert.Contains("Amount", sql);
    }

    private static Guid Id(int value) => Guid.Parse($"00000000-0000-0000-0000-{value:000000000000}");

    private static ApplicationDbContext CreateContext() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
      .UseNpgsql("Host=localhost;Database=translation_only;Username=unused;Password=unused").Options);

    private static DbSet<T> Set<T>(IEnumerable<T> items) where T : class
    {
      var query = items.AsQueryable();
      var set = new Mock<DbSet<T>>();
      set.As<IQueryable<T>>().Setup(o => o.Provider).Returns(query.Provider);
      set.As<IQueryable<T>>().Setup(o => o.Expression).Returns(query.Expression);
      set.As<IQueryable<T>>().Setup(o => o.ElementType).Returns(query.ElementType);
      set.As<IQueryable<T>>().Setup(o => o.GetEnumerator()).Returns(() => query.GetEnumerator());
      return set.Object;
    }
  }
}
