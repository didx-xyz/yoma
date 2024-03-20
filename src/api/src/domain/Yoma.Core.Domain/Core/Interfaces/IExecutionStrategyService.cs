namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IExecutionStrategyService
  {
    Task ExecuteInExecutionStrategyAsync(Func<Task> transactionBody);

    void ExecuteInExecutionStrategy(Action transactionBody);
  }
}
