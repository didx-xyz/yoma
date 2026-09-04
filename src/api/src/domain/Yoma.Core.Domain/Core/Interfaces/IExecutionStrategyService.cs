namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IExecutionStrategyService
  {
    Task ExecuteInExecutionStrategyAsync(Func<Task> transactionBody, bool clearTrackedChanges = false);

    void ExecuteInExecutionStrategy(Action transactionBody);
  }
}
