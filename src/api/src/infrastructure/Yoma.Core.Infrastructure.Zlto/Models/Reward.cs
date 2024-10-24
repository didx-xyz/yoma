using Newtonsoft.Json;
using static Yoma.Core.Infrastructure.Zlto.Models.Common;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
  public enum RewardEarnTaskStatus
  {
    Completed = 2
  }

  public class RewardEarnRequest
  {
    [JsonProperty("task_title")]
    public string TaskTitle { get; set; }

    [JsonProperty("task_origin")]
    public string TaskOrigin { get; set; }

    [JsonProperty("task_type")]
    public string TaskType { get; set; }

    [JsonProperty("task_description")]
    public string TaskDescription { get; set; }

    [JsonProperty("task_instructions")]
    public string TaskInstructions { get; set; }

    [JsonProperty("task_external_id")]
    public string TaskExternalId { get; set; }

    [JsonProperty("task_program_id")]
    public string TaskProgramId { get; set; }

    [JsonProperty("bank_transaction_id")]
    public string BankTransactionId { get; set; }

    [JsonProperty("zlto_wallet_id")]
    public string ZltoWalletId { get; set; }

    [JsonProperty("user_name")]
    public string Username { get; set; }

    [JsonProperty("task_zlto_reward")]
    public int TaskZltoReward { get; set; }

    [JsonProperty("task_skills")]
    public string TaskSkills { get; set; }

    [JsonProperty("task_country")]
    public string TaskCountry { get; set; }

    [JsonProperty("task_language")]
    public string TaskLanguage { get; set; }

    [JsonProperty("task_people_impacted")]
    public int TaskPeopleImpacted { get; set; }

    [JsonProperty("task_time_invested_hours")]
    public int TaskTimeInvestedHours { get; set; }

    [JsonProperty("task_external_url")]
    public string TaskExternalUrl { get; set; }

    [JsonProperty("task_external_proof")]
    public string TaskExternalProof { get; set; }

    [JsonProperty("task_needs_review")]
    public int TaskNeedsReview { get; set; }

    [JsonProperty("task_status")]
    public int TaskStatus { get; set; }

    [JsonProperty("task_start_time")]
    public string? TaskStartTime { get; set; }

    [JsonProperty("task_end_time")]
    public string? TaskEndTime { get; set; }
  }

  public class RewardEarnResponse
  {
    [JsonProperty("task_response")]
    public RewardEarnTask TaskResponse { get; set; }

    [JsonProperty("wallet_response")]
    public RewardEarnWallet WalletResponse { get; set; }

    [JsonProperty("bank_wallet_response")]
    public RewardEarnBankWallet BankWalletResponse { get; set; }

    [JsonProperty("bank_response")]
    public BankResponse BankResponse { get; set; }
  }

  public class RewardEarnTask
  {
    [JsonProperty("task_instructions")]
    public string TaskInstructions { get; set; }

    [JsonProperty("task_language")]
    public string TaskLanguage { get; set; }

    [JsonProperty("task_end_time")]
    public string TaskEndTime { get; set; }

    [JsonProperty("task_external_id")]
    public string TaskExternalId { get; set; }

    [JsonProperty("task_country")]
    public string TaskCountry { get; set; }

    [JsonProperty("task_start_time")]
    public string TaskStartTime { get; set; }

    [JsonProperty("task_skills")]
    public string TaskSkills { get; set; }

    [JsonProperty("task_status")]
    public int TaskStatus { get; set; }

    [JsonProperty("task_zlto_reward")]
    public int TaskZltoReward { get; set; }

    [JsonProperty("task_needs_review")]
    public int TaskNeedsReview { get; set; }

    [JsonProperty("task_title")]
    public string TaskTitle { get; set; }

    [JsonProperty("user_name")]
    public string Username { get; set; }

    [JsonProperty("task_external_proof")]
    public string TaskExternalProof { get; set; }

    [JsonProperty("task_origin")]
    public string TaskOrigin { get; set; }

    [JsonProperty("task_id")]
    public string TaskId { get; set; }

    [JsonProperty("task_program_id")]
    public string TaskProgramId { get; set; }

    [JsonProperty("zlto_wallet_id")]
    public string ZltoWalletId { get; set; }

    [JsonProperty("task_external_url")]
    public string TaskExternalUrl { get; set; }

    [JsonProperty("task_type")]
    public string TaskType { get; set; }

    [JsonProperty("bank_transaction_id")]
    public string BankTransactionId { get; set; }

    [JsonProperty("task_time_invested_hours")]
    public int TaskTimeInvestedHours { get; set; }

    [JsonProperty("date_created")]
    public string DateCreated { get; set; }

    [JsonProperty("task_description")]
    public string TaskDescription { get; set; }

    [JsonProperty("task_people_impacted")]
    public int TaskPeopleImpacted { get; set; }

    [JsonProperty("last_updated")]
    public string LastUpdated { get; set; }
  }

  public class RewardEarnWallet
  {
    [JsonProperty("transaction_type")]
    public int TransactionType { get; set; }

    [JsonProperty("wallet_id")]
    public string WalletId { get; set; }

    [JsonProperty("owner_id")]
    public string OwnerId { get; set; }

    [JsonProperty("transaction_status")]
    public int TransactionStatus { get; set; }

    [JsonProperty("date_created")]
    public string DateCreated { get; set; }

    [JsonProperty("transaction_payload")]
    public string TransactionPayload { get; set; }

    [JsonProperty("transaction_id")]
    public int TransactionId { get; set; }

    [JsonProperty("transaction_amount")]
    public double TransactionAmount { get; set; }

    [JsonProperty("last_updated")]
    public string LastUpdated { get; set; }
  }

  public class RewardEarnBankWallet
  {
    [JsonProperty("service_response")]
    public RewardEarnService ServiceResponse { get; set; }

    [JsonProperty("perform_transaction")]
    public string PerformTransaction { get; set; }

    [JsonProperty("bank_transaction")]
    public RewardEarnBankTransaction BankTransaction { get; set; }

    [JsonProperty("wallet_response")]
    public RewardEarnWallet WalletResponse { get; set; }
  }

  public class RewardEarnService
  {
    [JsonProperty(nameof(Default))]
    public string Default { get; set; }
  }

  public class RewardEarnBankTransaction
  {
    [JsonProperty("ztid")]
    public int ZtId { get; set; }

    [JsonProperty("acc_from")]
    public string AccFrom { get; set; }

    [JsonProperty("amount")]
    public int Amount { get; set; }

    [JsonProperty("trans_status")]
    public int TransStatus { get; set; }

    [JsonProperty("service_name")]
    public string ServiceName { get; set; }

    [JsonProperty("last_updated")]
    public string LastUpdated { get; set; }

    [JsonProperty("trans_type")]
    public int TransType { get; set; }

    [JsonProperty("acc_to")]
    public string AccTo { get; set; }

    [JsonProperty("trans_payload")]
    public string TransPayload { get; set; }

    [JsonProperty("service_ref_id")]
    public string ServiceRefId { get; set; }

    [JsonProperty("date_created")]
    public string DateCreated { get; set; }
  }
}
