using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class DelayedExecutionService : IDelayedExecutionService
  {
    #region Class Variables
    private readonly ILogger<DelayedExecutionService> _logger;
    private readonly List<(string? Name, string? Meta, Func<Task> Action)> _queue = [];
    #endregion

    #region Constructor
    public DelayedExecutionService(ILogger<DelayedExecutionService> logger)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    #endregion

    #region Public Members
    public int Count => _queue.Count;

    public void Enqueue(Func<Task> action, string? name = null, string? meta = null)
    {
      ArgumentNullException.ThrowIfNull(action);

      name = name?.Trim() ?? null;
      meta = meta?.Trim() ?? null;

      _queue.Add((name, meta, action));
    }

    public void Enqueue(Action action, string? name = null, string? meta = null)
    {
      ArgumentNullException.ThrowIfNull(action);
      _queue.Add((name, meta, () => { action(); return Task.CompletedTask; }));
    }

    public void Reset() => _queue.Clear();

    public async Task FlushAsync()
    {
      if (_queue.Count == 0) return;

      var batch = _queue.ToArray();
      _queue.Clear();

      foreach (var (name, meta, run) in batch)
      {
        try
        {
          await run().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Deferred action failed during flush. Action={ActionName}, Meta={Meta}", name ?? "(unnamed)", meta ?? "(none)");
        }
      }
    }
    #endregion
  }
}
