﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.42000
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Yoma.Core.Infrastructure.Twilio {
    using System;
    
    
    /// <summary>
    ///   A strongly-typed resource class, for looking up localized strings, etc.
    /// </summary>
    // This class was auto-generated by the StronglyTypedResourceBuilder
    // class via a tool like ResGen or Visual Studio.
    // To add or remove a member, edit your .ResX file then rerun ResGen
    // with the /str option, or rebuild your VS project.
    [global::System.CodeDom.Compiler.GeneratedCodeAttribute("System.Resources.Tools.StronglyTypedResourceBuilder", "17.0.0.0")]
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
    [global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
    internal class SMSTemplates {
        
        private static global::System.Resources.ResourceManager resourceMan;
        
        private static global::System.Globalization.CultureInfo resourceCulture;
        
        [global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
        internal SMSTemplates() {
        }
        
        /// <summary>
        ///   Returns the cached ResourceManager instance used by this class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        internal static global::System.Resources.ResourceManager ResourceManager {
            get {
                if (object.ReferenceEquals(resourceMan, null)) {
                    global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("Yoma.Core.Infrastructure.Twilio.SMSTemplates", typeof(SMSTemplates).Assembly);
                    resourceMan = temp;
                }
                return resourceMan;
            }
        }
        
        /// <summary>
        ///   Overrides the current thread's CurrentUICulture property for all
        ///   resource lookups using this strongly typed resource class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        internal static global::System.Globalization.CultureInfo Culture {
            get {
                return resourceCulture;
            }
            set {
                resourceCulture = value;
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Yoma{1} - You’ve completed {2}. Claim it here: {3}.
        /// </summary>
        internal static string ActionLink_Verify_Distribution {
            get {
                return ResourceManager.GetString("ActionLink_Verify_Distribution", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Yoma{2} - A new opportunity just dropped! Check it out: {3}.
        /// </summary>
        internal static string Opportunity_Published {
            get {
                return ResourceManager.GetString("Opportunity_Published", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Yoma{2} - Your submission has been approved! View your YoID: {3}.
        /// </summary>
        internal static string Opportunity_Verification_Completed {
            get {
                return ResourceManager.GetString("Opportunity_Verification_Completed", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Yoma{2} - Your submission wasn&apos;t approved. Please try again: {3}.
        /// </summary>
        internal static string Opportunity_Verification_Rejected {
            get {
                return ResourceManager.GetString("Opportunity_Verification_Rejected", resourceCulture);
            }
        }
    }
}
