
namespace Yoma.Core.Domain.Core.Interfaces
{
  /// <summary>
  /// Supports deterministic hash generation by allowing an object to normalize itself before hashing.
  /// </summary>
  public interface IHashableObject
  {
    /// <summary>
    /// Normalizes the object into a deterministic state before hashing,
    /// such as ensuring consistent collection ordering where order is not meaningful.
    /// </summary>
    void NormalizeForHashing();
  }
}
