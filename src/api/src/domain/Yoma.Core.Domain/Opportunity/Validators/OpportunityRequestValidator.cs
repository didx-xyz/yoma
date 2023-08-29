using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunityRequestValidator : AbstractValidator<OpportunityRequest>
    {
        #region Class Variables
        private readonly IOpportunityTypeService _opportunityTypeService;
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityDifficultyService _opportunityDifficultyService;
        private readonly ITimeIntervalService _timeIntervalService;
        #endregion

        #region Public Members
        public OpportunityRequestValidator(IOpportunityTypeService opportunityTypeService,
            IOrganizationService organizationService,
            IOpportunityDifficultyService opportunityDifficultyService,
            ITimeIntervalService timeIntervalService)
        {
            _opportunityTypeService = opportunityTypeService;
            _organizationService = organizationService;
            _opportunityDifficultyService = opportunityDifficultyService;
            _timeIntervalService = timeIntervalService;

            RuleFor(x => x.Id).NotEmpty().When(x => x.Id.HasValue).WithMessage("{PropertyName} contains empty value.");
            RuleFor(x => x.Title).NotEmpty().Length(1, 255);
            RuleFor(x => x.Description).NotEmpty();
            RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
            RuleFor(x => x.OrganizationId).NotEmpty().Must(OrganizationUpdatable).WithMessage($"Specified organization has been declined / deleted or does not exist.");
            //instructions (varchar(max); auto trimmed
            RuleFor(x => x.URL).Length(1, 2048).Must(ValidURL).When(x => string.IsNullOrEmpty(x.URL)).WithMessage("'{PropertyName}' is invalid.");
            RuleFor(x => x.ZltoReward).GreaterThan(0).When(x => x.ZltoReward.HasValue).WithMessage("'{PropertyName}' must be greater than 0");
            RuleFor(x => x.YomaReward).GreaterThan(0).When(x => x.YomaReward.HasValue).WithMessage("'{PropertyName}' must be greater than 0");
            RuleFor(x => x.ZltoRewardPool).GreaterThan(0).When(x => x.ZltoRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0").
                Must((model, zltoRewardPool) => !model.ZltoRewardPool.HasValue || (model.ZltoReward.HasValue && zltoRewardPool >= model.ZltoReward)).WithMessage("'{PropertyName}' must be greater than or equal to ZltoReward.");
            RuleFor(x => x.YomaRewardPool).GreaterThan(0).When(x => x.YomaRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0").
                Must((model, yomaRewardPool) => !model.YomaRewardPool.HasValue || (model.YomaReward.HasValue && yomaRewardPool >= model.YomaReward)).WithMessage("'{PropertyName}' must be greater than or equal to YomaReward."); ;
            RuleFor(x => x.DifficultyId).NotEmpty().Must(DifficultyExists).WithMessage($"Specified difficulty is invalid / does not exist.");
            RuleFor(x => x.CommitmentIntervalId).NotEmpty().Must(TimeIntervalExists).WithMessage($"Specified time interval is invalid / does not exist.");
            RuleFor(x => x.CommitmentIntervalCount).Must(x => x.HasValue && x > 0).When(x => x.CommitmentIntervalCount.HasValue).WithMessage("'{PropertyName}' must be greater than 0");
            RuleFor(x => x.ParticipantLimit).Must(x => x.HasValue && x > 0).When(x => x.ParticipantLimit.HasValue).WithMessage("'{PropertyName}' must be greater than 0");
            RuleFor(x => x.Keywords).Must(keywords => keywords == null || keywords.All(x => !string.IsNullOrWhiteSpace(x) && !x.Contains(OpportunityService.Keywords_Separator))).WithMessage("{PropertyName} contains empty value(s) or keywords with ',' character.");
            RuleFor(model => model.Keywords).Must(list => list == null || CalculateCombinedLength(list) >= 1 && CalculateCombinedLength(list) <= OpportunityService.Keywords_CombinedMaxLength).WithMessage("The combined length of keywords must be between 1 and 500 characters.");
            RuleFor(x => x.DateStart).NotEmpty();
            RuleFor(model => model.DateEnd).GreaterThanOrEqualTo(model => model.DateStart).When(model => model.DateEnd.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
        }
        #endregion

        #region Private Members
        private bool TypeExists(Guid typeId)
        {
            return _opportunityTypeService.GetByIdOrNull(typeId) != null;
        }

        private bool DifficultyExists(Guid typeId)
        {
            return _opportunityDifficultyService.GetByIdOrNull(typeId) != null;
        }

        private bool TimeIntervalExists(Guid typeId)
        {
            return _timeIntervalService.GetByIdOrNull(typeId) != null;
        }

        private bool OrganizationUpdatable(Guid organizationId)
        {
            return _organizationService.Updatable(organizationId, false);
        }

        private bool ValidURL(string? url)
        {
            if (url == null) return true;
            return Uri.IsWellFormedUriString(url, UriKind.Absolute);
        }

        private static int CalculateCombinedLength(List<string> list)
        {
            if (list == null) return 0;

            return string.Join(OpportunityService.Keywords_Separator, list).Length;
        }
        #endregion
    }
}
