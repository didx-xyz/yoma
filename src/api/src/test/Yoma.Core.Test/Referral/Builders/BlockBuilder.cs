using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class BlockBuilder
  {
    private Guid _id = Guid.NewGuid();
    private Guid _userId = Guid.NewGuid();
    private Guid _reasonId = LookupBuilder.BlockReasonOtherId;
    private string _reason = "Other";
    private string _reasonDescription = "Other reason";
    private string? _commentBlock = "Suspicious activity";
    private string? _commentUnBlock;
    private bool _active = true;
    private DateTimeOffset _dateCreated = DateTimeOffset.UtcNow;
    private Guid _createdByUserId = Guid.NewGuid();
    private DateTimeOffset _dateModified = DateTimeOffset.UtcNow;
    private Guid _modifiedByUserId = Guid.NewGuid();

    public BlockBuilder WithId(Guid id) { _id = id; return this; }
    public BlockBuilder WithUserId(Guid userId) { _userId = userId; return this; }
    public BlockBuilder WithReasonId(Guid reasonId) { _reasonId = reasonId; return this; }
    public BlockBuilder WithComment(string? comment) { _commentBlock = comment; return this; }
    public BlockBuilder AsActive() { _active = true; return this; }
    public BlockBuilder AsInactive() { _active = false; return this; }

    public Block Build() => new()
    {
      Id = _id,
      UserId = _userId,
      ReasonId = _reasonId,
      Reason = _reason,
      ReasonDescription = _reasonDescription,
      CommentBlock = _commentBlock,
      CommentUnBlock = _commentUnBlock,
      Active = _active,
      DateCreated = _dateCreated,
      CreatedByUserId = _createdByUserId,
      DateModified = _dateModified,
      ModifiedByUserId = _modifiedByUserId
    };
  }
}
