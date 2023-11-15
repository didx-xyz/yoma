using Flurl.Http;
using Yoma.Core.Infrastructure.Emsi.Models;
using Yoma.Core.Domain.Core.Extensions;
using Flurl;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.LaborMarketProvider.Models;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Infrastructure.Emsi.Client
{
    public class EmsiClient : ILaborMarketProviderClient
    {
        #region Class Variables
        private readonly EmsiOptions _options;
        private OAuthResponse _accessToken;

        private const string Header_Authorization = "Authorization";
        private const string Header_Authorization_Value_Prefix = "Bearer";
        #endregion

        #region Constructor
        public EmsiClient(EmsiOptions options)
        {
            _options = options;
        }
        #endregion

        #region Public Members
#pragma warning disable CS1998 // TODO: Remove; Async method lacks 'await' operators and will run synchronously
        public async Task<List<Domain.LaborMarketProvider.Models.Skill>?> ListSkills()
#pragma warning restore CS1998 // TODO: Remove; Async method lacks 'await' operators and will run synchronously
        {
            //TODO: Remove; Temporary list due to EMSI being offline
            var results = new List<Domain.LaborMarketProvider.Models.Skill>()
            {
                new Domain.LaborMarketProvider.Models.Skill { Name = "(American Society For Quality) ASQ Certified" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Assemblies" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Framework" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Framework 1" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Framework 3" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Framework 4" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Reflector" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".NET Remoting" },
                new Domain.LaborMarketProvider.Models.Skill { Name = ".nettiers" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10 Gigabit Ethernet" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "1010data" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10BASE-F (Physical Layer Protocols)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10BASE-FL" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10BASE2" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10BASE5" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "10G-PON" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "123RF (Image Library)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "128bit" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "12factor" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "1Password" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2020 Design Software" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2checkout" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2D Animation" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2D Computer Graphics" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2D Computer-Aided Drafting And Design" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "2D Gel Analysis Software" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3.5G (Telecommunication)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "35 Mm Films" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "389 Directory Server (Fedora Project)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3COM Certified IP Telephony NBX Expert" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3COM Certified IP Telephony VCX Expert" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3CX Phone Systems" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Animation" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Art" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Camcorder" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Computer Graphics" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Computer Graphics Software" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Conformal Radiotherapy (3DCRT)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3d Engine" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Graphic Design" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Modeling" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Modeling Software" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Printing" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Projection" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Reconstruction" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Rendering" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Scanning" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3d Secure" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3d Solid And Surface Modeling" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Touch" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3D Visualization" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3Delight (Software)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3DMark (Computer Benchmarking)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3DML" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3DSlicer" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3Dvia Composer" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3GP (Telecommunication)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3GPP (Telecommunication)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "3GPP2 (Telecommunication)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "4d Database" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "4D Modeling (Construction)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "4DOS (Command Line Interpreter)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "4Sight" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "50% Tissue Culture Infective Dose (TCID50)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "529 College Savings Planning" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "56 Kbit/S Modems" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "5G Technology" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "64-Bit Power PC Processors" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "64bit" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "6LoWPAN" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "7-Zip" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "8 Mm Video Format (Video Storage)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "90nm CMOS" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "960.gs" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "A-Files Accountability And Control Systems" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "A/B Testing" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "A3 Problem Solving Techniques" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "A431 Cells (Cell Lines)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "AAA Protocol (Code Division Multiple Access)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "AAA Server (Authentication Authorization And Accounting)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "AAA Video Games" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Ab Initio (Software)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "ABA Intervention" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abaqus" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abc Analysis" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "ABC FlowCharter" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abcpdf" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abdomen (Medical)" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abdominal Surgery" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abdominal Trauma" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abdominal Ultrasonography" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abdominoplasty" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "ABI Solid Sequencing" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "ABINIT" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Abiquo Enterprise Edition" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "AbiWord" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "ABL Radiometers" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Ablation" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Able2Extract" },
                new Domain.LaborMarketProvider.Models.Skill { Name = "Ableton Live" },
            };

            results.ForEach(o => o.Id = HashHelper.ComputeSHA256Hash(o.Name));
            return results;

            //var resp = await _options.BaseUrl
            //   .AppendPathSegment($"/skills/versions/latest/skills")
            //   .WithAuthHeaders(await GetAuthHeaders(AuthScope.Skills))
            //   .GetAsync()
            //   .EnsureSuccessStatusCodeAsync();

            //var results = await resp.GetJsonAsync<SkillResponse>();

            //return results?.Data.Select(o => new Domain.LaborMarketProvider.Models.Skill { Id = o.Id, Name = o.Name, InfoURL = o.InfoUrl }).ToList();
        }

        public async Task<List<JobTitle>?> ListJobTitles()
        {
            var resp = await _options.BaseUrl
               .AppendPathSegment($"/titles/versions/latest/titles")
               .WithAuthHeaders(await GetAuthHeaders(AuthScope.Jobs))
               .GetAsync()
               .EnsureSuccessStatusCodeAsync();

            var results = await resp.GetJsonAsync<TitleResponse>();

            return results?.Data?.Select(o => new JobTitle { Id = o.Id, Name = o.Name }).ToList();
        }
        #endregion

        #region Private Members
        private async Task<KeyValuePair<string, string>> GetAuthHeaders(AuthScope scope)
        {
            if (_accessToken != null && _accessToken.DateExpire > DateTimeOffset.Now)
                return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");

            var data = new Dictionary<string, string>
            {
                { "client_id", _options.ClientId },
                { "client_secret", _options.ClientSecret },
                { "grant_type", "client_credentials"},
                { "scope", scope.ToDescription() }
            };

            _accessToken = await _options.AuthUrl
               .PostUrlEncodedAsync(data)
               .EnsureSuccessStatusCodeAsync()
               .ReceiveJson<OAuthResponse>();

            return new KeyValuePair<string, string>(Header_Authorization, $"{Header_Authorization_Value_Prefix} {_accessToken.Access_token}");
        }
        #endregion
    }
}
