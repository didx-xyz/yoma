using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using Yoma.Core.Api.Common;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Api.Attributes
{
    [AttributeUsage(validOn: AttributeTargets.Class | AttributeTargets.Method)]
    public class ApiKeyAttribute : Attribute, IAsyncActionFilter
    {
        #region Class Variables
        private readonly IOrganizationService _organizationService;
        #endregion

        #region Constructor
        public ApiKeyAttribute(IOrganizationService organizationService)
        {
            _organizationService = organizationService;
        }
        #endregion

        #region Public Members
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!context.HttpContext.Request.Headers.TryGetValue(Constants.RequestHeader_ApiKey, out var extractedApiKey))
            {
                context.Result = new ContentResult()
                {
                    StatusCode = (int)HttpStatusCode.Unauthorized,
                    Content = HttpStatusCode.Unauthorized.ToString()
                };
                return;
            }

            var organization = _organizationService.GetByApiKeyOrNull(extractedApiKey.ToString());
            if (organization == null)
            {
                context.Result = new ContentResult()
                {
                    StatusCode = (int)HttpStatusCode.Unauthorized,
                    Content = HttpStatusCode.Unauthorized.ToString()
                };
                return;
            }

            //store the authenticated organization id in HttpContext.Items for subsequent use (HttpContext.Items.TryGetValue(Constants.HttpContextItemsKey_Authenticated_OrganizationId, out var organizationIdObj) && organizationIdObj is Guid organizationId)
            context.HttpContext.Items[Constants.HttpContextItemsKey_Authenticated_OrganizationId] = organization.Id;

            await next();
        }
        #endregion
    }
}
