using System.Runtime.Serialization;

namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public enum WebhookEventType
  {
    None = 0,

    [EnumMember(Value = "chimoney.payment.completed")]
    ChimoneyPaymentCompleted,

    [EnumMember(Value = "chimoney.payment.failed")]
    ChimoneyPaymentFailed,

    [EnumMember(Value = "chimoney.payment.expired")]
    ChimoneyPaymentExpired
  }

  public enum WebhookStatus
  {
    None = 0,

    [EnumMember(Value = "success")]
    Success,

    [EnumMember(Value = "paid")]
    Paid,

    [EnumMember(Value = "failed")]
    Failed,

    [EnumMember(Value = "expired")]
    Expired
  }
}
