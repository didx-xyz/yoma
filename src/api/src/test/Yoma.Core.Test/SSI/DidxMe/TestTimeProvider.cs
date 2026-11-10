namespace Yoma.Core.Test.SSI.DidxMe
{
  internal sealed class TestTimeProvider : TimeProvider
  {
    private DateTimeOffset _utcNow = DateTimeOffset.FromUnixTimeSeconds(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
    public override DateTimeOffset GetUtcNow() => _utcNow;
    public void Advance(TimeSpan duration) => _utcNow += duration;
  }
}
