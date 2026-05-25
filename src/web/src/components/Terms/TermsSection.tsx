const TermsSection: React.FC = () => {
  return (
    <div className="terms-content text-gray-dark flex flex-col gap-4 overflow-hidden">
      <h1>Yoma Terms of Service</h1>
      <p>
        <strong className="text-black">Last Updated:</strong> October 2025
      </p>
      <p>
        Thank you for your interest in Yoma. These Terms of Service govern your
        use of the Yoma platform, available at{" "}
        <a
          href="https://yoma.world/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          https://yoma.world/
        </a>{" "}
        and{" "}
        <a
          href="https://yoma.africa/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          https://yoma.africa/
        </a>
        , including all related APIs, mobile applications, and services
        (collectively, the &quot;Platform&quot; or &quot;Services&quot;).
      </p>
      <p>
        <strong className="text-black">
          By registering for or using Yoma, you agree to these Terms.
        </strong>{" "}
        Please read them carefully.
      </p>

      <h2>Table of Contents</h2>
      <ol className="list-inside list-decimal font-semibold">
        <li>
          <a href="#about-yoma" className="underline">
            About Yoma
          </a>
        </li>
        <li>
          <a href="#who-can-use-yoma" className="underline">
            Who Can Use Yoma
          </a>
        </li>
        <li>
          <a href="#registration-and-your-account" className="underline">
            Registration and Your Account
          </a>
        </li>
        <li>
          <a href="#how-yoma-works" className="underline">
            How Yoma Works
          </a>
        </li>
        <li>
          <a href="#your-rights-and-responsibilities" className="underline">
            Your Rights and Responsibilities
          </a>
        </li>
        <li>
          <a href="#partner-roles-and-permissions" className="underline">
            Partner Roles and Permissions
          </a>
        </li>
        <li>
          <a href="#privacy-and-data-protection" className="underline">
            Privacy and Data Protection
          </a>
        </li>
        <li>
          <a
            href="#platform-rules-and-prohibited-conduct"
            className="underline"
          >
            Platform Rules and Prohibited Conduct
          </a>
        </li>
        <li>
          <a href="#intellectual-property" className="underline">
            Intellectual Property
          </a>
        </li>
        <li>
          <a href="#disclaimers-and-limitations" className="underline">
            Disclaimers and Limitations
          </a>
        </li>
        <li>
          <a href="#changes-to-these-terms" className="underline">
            Changes to These Terms
          </a>
        </li>
        <li>
          <a href="#termination-and-account-deletion" className="underline">
            Termination and Account Deletion
          </a>
        </li>
        <li>
          <a href="#contact-us" className="underline">
            Contact Us
          </a>
        </li>
      </ol>

      {/* Section 1 */}
      <h2 id="about-yoma">1. About Yoma</h2>
      <p>
        Yoma is a youth agency marketplace operated by RLabs, a non-profit
        organization based in South Africa. We connect young people worldwide
        with opportunities for skills development, impact work, and employment.
      </p>
      <p className="font-bold text-black">Our Mission:</p>
      <p>
        To create pathways from learning to earning by providing youth with
        verified credentials (YoID), opportunity discovery, and digital rewards
        (ZLTO tokens).
      </p>
      <p className="font-bold text-black">Our Partners:</p>
      <p>
        Yoma is supported by UNICEF, Generation Unlimited, and a global network
        of opportunity providers, employers, training organizations, and impact
        partners.
      </p>
      <p className="font-bold text-black">Our Commitment:</p>
      <p>
        Yoma is free to use for all youth and partners. We are funded by donors
        and development partners to ensure no financial barriers prevent access
        to opportunities.
      </p>

      {/* Section 2 */}
      <h2 id="who-can-use-yoma">2. Who Can Use Yoma</h2>
      <p className="font-bold text-black">Age Requirements</p>
      <p>Yoma is available to:</p>
      <ul className="list-inside list-disc">
        <li>
          <strong className="text-black">Youth aged 16 and older</strong> who
          can independently register and use the platform
        </li>
        <li>
          <strong className="text-black">Youth under 16</strong> with explicit
          approval from a parent or legal guardian
        </li>
        <li>
          <strong className="text-black">
            Opportunity providers, employers, and organizations
          </strong>{" "}
          who wish to connect with youth
        </li>
      </ul>
      <p className="font-bold text-black">Parental Consent</p>
      <p>
        If you are under 16, a parent or legal guardian must approve your
        registration. By approving, your parent or guardian agrees to:
      </p>
      <ul className="list-inside list-disc">
        <li>Be responsible for your activities on Yoma</li>
        <li>Monitor your use of the platform</li>
        <li>Accept these Terms on your behalf</li>
      </ul>
      <p>
        If you are a parent or guardian and discover your child has created an
        unauthorized account, please contact us at{" "}
        <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
          admin@yoma.world
        </a>{" "}
        and we will remove it.
      </p>
      <p className="font-bold text-black">Regional Availability</p>
      <p>
        Yoma is accessible globally. Some opportunities may be restricted to
        specific countries or regions based on partner requirements.
      </p>

      {/* Section 3 */}
      <h2 id="registration-and-your-account">
        3. Registration and Your Account
      </h2>
      <p className="font-bold text-black">Creating Your Account</p>
      <p>To use Yoma, you must register with:</p>
      <ul className="list-inside list-disc">
        <li>First and last name</li>
        <li>Email address</li>
        <li>Password</li>
        <li>Country of residence</li>
        <li>Country of birth</li>
        <li>Date of birth</li>
        <li>Gender</li>
        <li>Mobile number (optional, for communications)</li>
      </ul>
      <p>All information must be accurate, current, and complete.</p>
      <p className="font-bold text-black">Account Security</p>
      <p>You are responsible for:</p>
      <ul className="list-inside list-disc">
        <li>Keeping your password confidential</li>
        <li>All activities under your account</li>
        <li>
          Notifying us immediately at{" "}
          <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
            admin@yoma.world
          </a>{" "}
          if you suspect unauthorized access
        </li>
      </ul>
      <p className="font-bold text-black">Account Ownership</p>
      <p>
        Your Yoma account is personal and non-transferable. You cannot sell,
        transfer, or share your account with others.
      </p>
      <p className="font-bold text-black">Keeping Information Updated</p>
      <p>
        You must keep your profile information current. You can update your
        details anytime through your account settings.
      </p>

      {/* Section 4 */}
      <h2 id="how-yoma-works">4. How Yoma Works</h2>
      <p className="font-bold text-black">Opportunities</p>
      <p>
        Yoma aggregates opportunities from partner organizations, including:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong className="text-black">Learning opportunities:</strong>{" "}
          Courses, training programs, certifications
        </li>
        <li>
          <strong className="text-black">Impact opportunities:</strong>{" "}
          Volunteer work, social projects, community tasks
        </li>
        <li>
          <strong className="text-black">Employment opportunities:</strong>{" "}
          Jobs, internships, apprenticeships, freelance work
        </li>
      </ul>
      <p className="font-bold text-black">YoID (Your Verified Identity)</p>
      <p>YoID is your digital credential wallet. It enables you to:</p>
      <ul className="list-inside list-disc">
        <li>Store verified credentials issued by partners</li>
        <li>Prove your skills and achievements</li>
        <li>Share your credentials with employers and organizations</li>
        <li>Build a portable, verified portfolio</li>
      </ul>
      <p>
        YoID is based on self-sovereign identity principles—you own and control
        your credentials.
      </p>
      <p className="font-bold text-black">ZLTO (Digital Rewards)</p>
      <p>ZLTO tokens are digital rewards you earn by:</p>
      <ul className="list-inside list-disc">
        <li>Completing opportunities</li>
        <li>Finishing training programs</li>
        <li>Participating in impact work</li>
        <li>Engaging with the platform</li>
      </ul>
      <p>You can spend ZLTO on:</p>
      <ul className="list-inside list-disc">
        <li>Goods and services from marketplace vendors</li>
        <li>Airtime and data bundles</li>
        <li>Access to premium opportunities (where applicable)</li>
      </ul>
      <p>
        ZLTO is sponsored by partners and funders—you never pay to earn ZLTO.
      </p>
      <p className="font-bold text-black">The Marketplace</p>
      <p>
        The Yoma marketplace connects you with vendors who accept ZLTO.
        Available products and services vary by region.
      </p>
      <p className="font-bold text-black">Third-Party Platforms</p>
      <p>
        Many opportunities require additional steps on partner platforms. When
        you apply for an opportunity:
      </p>
      <ol className="list-inside list-decimal">
        <li>
          Yoma pre-fills your application with verified YoID data (with your
          permission)
        </li>
        <li>You may be redirected to the partner&apos;s platform</li>
        <li>You complete the opportunity on the partner&apos;s platform</li>
        <li>Upon completion, the partner issues a credential to your YoID</li>
        <li>The credential appears in your Yoma portfolio</li>
      </ol>
      <p>
        <strong className="text-black">Important:</strong> Each partner has
        their own Terms of Service and Privacy Policy. You must review and
        accept these before engaging with their opportunities.
      </p>

      {/* Section 5 */}
      <h2 id="your-rights-and-responsibilities">
        5. Your Rights and Responsibilities
      </h2>
      <p className="font-bold text-black">Your Rights</p>
      <p>You have the right to:</p>
      <ul className="list-inside list-disc">
        <li>
          <strong className="text-black">Own your data:</strong> Under
          self-sovereign identity principles, you control your information
        </li>
        <li>
          <strong className="text-black">Choose what to share:</strong> Decide
          which credentials and data to share with partners
        </li>
        <li>
          <strong className="text-black">Access your information:</strong> View
          and download all your data at any time
        </li>
        <li>
          <strong className="text-black">Delete your account:</strong> Request
          deletion at any time (see Section 12)
        </li>
        <li>
          <strong className="text-black">Portability:</strong> Export your
          credentials for use on other platforms
        </li>
      </ul>
      <p className="font-bold text-black">Your Responsibilities</p>
      <p>You agree to:</p>
      <ul className="list-inside list-disc">
        <li>Provide accurate and truthful information</li>
        <li>Use Yoma only for legitimate purposes</li>
        <li>Respect other users and partners</li>
        <li>Follow all applicable laws and regulations</li>
        <li>Not misuse the platform or attempt to harm its operations</li>
        <li>Keep your account secure</li>
      </ul>
      <p className="font-bold text-black">Data You Share</p>
      <p>When you apply for an opportunity or connect with a partner:</p>
      <ul className="list-inside list-disc">
        <li>You choose which credentials to share</li>
        <li>Partners receive only the information you authorize</li>
        <li>
          Your full profile is never visible to partners unless you consent
        </li>
        <li>You can revoke access to shared credentials at any time</li>
      </ul>

      {/* Section 6 */}
      <h2 id="partner-roles-and-permissions">
        6. Partner Roles and Permissions
      </h2>
      <p className="font-bold text-black">Youth (Primary Users)</p>
      <p>As a youth user, you can:</p>
      <ul className="list-inside list-disc">
        <li>Browse and apply for opportunities</li>
        <li>Earn and store verified credentials</li>
        <li>Build and share your digital CV</li>
        <li>Earn and spend ZLTO tokens</li>
        <li>Connect with other youth (where enabled)</li>
      </ul>
      <p>
        Partners cannot contact you unless you initiate engagement by applying
        to their opportunities.
      </p>
      <p className="font-bold text-black">Opportunity Providers</p>
      <p>Opportunity providers can:</p>
      <ul className="list-inside list-disc">
        <li>List learning, impact, or employment opportunities</li>
        <li>Review applications from youth who express interest</li>
        <li>Issue verified credentials upon opportunity completion</li>
        <li>
          Access limited profile information (name, email) only after youth
          apply
        </li>
      </ul>
      <p>They cannot:</p>
      <ul className="list-inside list-disc">
        <li>Access youth data without consent</li>
        <li>Initiate unsolicited contact with youth</li>
        <li>View full profiles or credentials without authorization</li>
      </ul>
      <p className="font-bold text-black">Employers</p>
      <p>Employers can:</p>
      <ul className="list-inside list-disc">
        <li>Post job and internship opportunities</li>
        <li>Review applications from interested youth</li>
        <li>Access shared credentials and CVs (with youth consent)</li>
        <li>Connect with applicants through Yoma or their own systems</li>
      </ul>
      <p>They cannot:</p>
      <ul className="list-inside list-disc">
        <li>Contact youth who haven&apos;t applied</li>
        <li>Access youth data without consent</li>
        <li>
          Require youth to leave the platform to apply (pre-filled applications
          available)
        </li>
      </ul>
      <p className="font-bold text-black">Marketplace Vendors</p>
      <p>Vendors can:</p>
      <ul className="list-inside list-disc">
        <li>List products and services</li>
        <li>Accept ZLTO as payment</li>
        <li>Fulfill transactions with youth</li>
      </ul>
      <p>
        They receive transaction information only as needed to complete
        purchases.
      </p>
      <p className="font-bold text-black">Yoma Technical Team</p>
      <p>Our development and support team can:</p>
      <ul className="list-inside list-disc">
        <li>Access databases for troubleshooting and platform maintenance</li>
        <li>View user activity logs to resolve technical issues</li>
        <li>Investigate reports of misuse or policy violations</li>
      </ul>
      <p>Access is strictly limited to:</p>
      <ul className="list-inside list-disc">
        <li>Authorized personnel only</li>
        <li>Specific data fields required for the task</li>
        <li>Logged and audited activities</li>
        <li>Requests approved by the Product Owner</li>
      </ul>

      {/* Section 7 */}
      <h2 id="privacy-and-data-protection">7. Privacy and Data Protection</h2>
      <p className="font-bold text-black">Our Commitment</p>
      <p>Yoma operates on three privacy principles:</p>
      <ol className="list-inside list-decimal">
        <li>
          <strong className="text-black">Self-Sovereign Identity:</strong> You
          own and control your data
        </li>
        <li>
          <strong className="text-black">Data Portability:</strong> Your
          credentials work beyond Yoma
        </li>
        <li>
          <strong className="text-black">Data Minimization:</strong> We collect
          only what&apos;s necessary
        </li>
      </ol>
      <p className="font-bold text-black">What We Collect</p>
      <p>
        We collect information you provide during registration and platform use:
      </p>
      <ul className="list-inside list-disc">
        <li>Profile information (name, email, location, demographics)</li>
        <li>Opportunity applications and completions</li>
        <li>Credentials and achievements</li>
        <li>ZLTO transactions</li>
        <li>Platform activity and interactions</li>
        <li>Technical data (device type, IP address, browser information)</li>
      </ul>
      <p className="font-bold text-black">How We Use Your Data</p>
      <p>We use your information to:</p>
      <ul className="list-inside list-disc">
        <li>Provide platform services</li>
        <li>Match you with relevant opportunities</li>
        <li>Issue and verify credentials</li>
        <li>Process ZLTO transactions</li>
        <li>Improve the platform</li>
        <li>Communicate important updates</li>
        <li>Generate anonymized analytics for partners and funders</li>
      </ul>
      <p className="font-bold text-black">Data Sharing</p>
      <p>We share data only when necessary and with your consent:</p>
      <ul className="list-inside list-disc">
        <li>
          <strong className="text-black">With partners:</strong> Only when you
          apply to their opportunities, and only the information you authorize
        </li>
        <li>
          <strong className="text-black">With funders:</strong> Anonymized,
          aggregated data for impact reporting (no personal information)
        </li>
        <li>
          <strong className="text-black">With vendors:</strong> Transaction
          information for marketplace purchases
        </li>
        <li>
          <strong className="text-black">With analytics providers:</strong>{" "}
          Anonymized usage data to improve services
        </li>
        <li>
          <strong className="text-black">As required by law:</strong> If legally
          obligated to disclose information
        </li>
      </ul>
      <p>We never sell your personal data to third parties.</p>
      <p className="font-bold text-black">Data Storage</p>
      <p>
        Your data is stored securely on servers in the United Kingdom, compliant
        with GDPR and UK data protection laws.
      </p>
      <p className="font-bold text-black">Data Retention</p>
      <p>We retain your data for:</p>
      <ul className="list-inside list-disc">
        <li>
          <strong className="text-black">Active accounts:</strong> Duration of
          account existence plus 12 months after last activity
        </li>
        <li>
          <strong className="text-black">Deleted accounts:</strong> 30 days for
          recovery, then permanently deleted
        </li>
        <li>
          <strong className="text-black">Legal requirements:</strong> Longer if
          required by law
        </li>
      </ul>
      <p className="font-bold text-black">Your Privacy Rights</p>
      <p>
        Under GDPR and applicable data protection laws, you have the right to:
      </p>
      <ul className="list-inside list-disc">
        <li>Access your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Delete your data (&quot;right to be forgotten&quot;)</li>
        <li>Restrict processing</li>
        <li>Data portability</li>
        <li>Object to processing</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>
        To exercise these rights, contact{" "}
        <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
          admin@yoma.world
        </a>
        . For full details, see our Privacy Policy.
      </p>

      {/* Section 8 */}
      <h2 id="platform-rules-and-prohibited-conduct">
        8. Platform Rules and Prohibited Conduct
      </h2>
      <p className="font-bold text-black">Acceptable Use</p>
      <p>Yoma must be used only for:</p>
      <ul className="list-inside list-disc">
        <li>Skills development</li>
        <li>Employment seeking</li>
        <li>Impact work</li>
        <li>Legitimate educational purposes</li>
      </ul>
      <p className="font-bold text-black">Prohibited Activities</p>
      <p>You may not:</p>
      <p className="font-semibold text-black">General Prohibitions:</p>
      <ul className="list-inside list-disc">
        <li>
          Use Yoma for commercial, political, or religious promotion unrelated
          to opportunities
        </li>
        <li>Impersonate others or create fake accounts</li>
        <li>Share false or misleading information</li>
        <li>Harass, threaten, or abuse other users</li>
        <li>Attempt to gain unauthorized access to systems or accounts</li>
      </ul>
      <p className="font-semibold text-black">Content Prohibitions:</p>
      <ul className="list-inside list-disc">
        <li>Post illegal, harmful, or offensive content</li>
        <li>Share content that is racist, violent, abusive, or pornographic</li>
        <li>Upload copyrighted material without permission</li>
        <li>Distribute malware, viruses, or malicious code</li>
        <li>Spam or send unsolicited messages</li>
      </ul>
      <p className="font-semibold text-black">Data Prohibitions:</p>
      <ul className="list-inside list-disc">
        <li>Share other users&apos; personal information without consent</li>
        <li>Scrape or harvest data from the platform</li>
        <li>Use automated systems (bots) without authorization</li>
        <li>Attempt to reverse-engineer platform technology</li>
      </ul>
      <p className="font-semibold text-black">ZLTO Misuse:</p>
      <ul className="list-inside list-disc">
        <li>Fraud or manipulation of the rewards system</li>
        <li>Selling or trading ZLTO outside authorized channels</li>
        <li>Creating multiple accounts to exploit rewards</li>
      </ul>
      <p className="font-bold text-black">Reporting Violations</p>
      <p>
        If you encounter prohibited conduct, report it to{" "}
        <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
          admin@yoma.world
        </a>{" "}
        or use the in-platform reporting tools.
      </p>
      <p className="font-bold text-black">Consequences</p>
      <p>Violations may result in:</p>
      <ul className="list-inside list-disc">
        <li>Warning and required corrective action</li>
        <li>Temporary suspension</li>
        <li>Permanent account termination</li>
        <li>Referral to law enforcement (for illegal activities)</li>
        <li>Legal action for damages</li>
      </ul>

      {/* Section 9 */}
      <h2 id="intellectual-property">9. Intellectual Property</h2>
      <p className="font-bold text-black">Yoma Content</p>
      <p>
        All content on Yoma—including text, graphics, logos, software, and
        design—is owned by RLabs or licensed to us. You may not:
      </p>
      <ul className="list-inside list-disc">
        <li>Copy, modify, or distribute our content without permission</li>
        <li>Use our trademarks or branding without authorization</li>
        <li>Reverse-engineer our platform or technology</li>
      </ul>
      <p className="font-bold text-black">User Content</p>
      <p>
        When you post content on Yoma (such as profile information, comments, or
        submissions), you:
      </p>
      <ul className="list-inside list-disc">
        <li>Retain ownership of your content</li>
        <li>
          Grant Yoma a license to use, display, and distribute your content as
          necessary to provide services
        </li>
        <li>Confirm you have the right to post the content</li>
        <li>Agree your content complies with these Terms</li>
      </ul>
      <p className="font-bold text-black">Partner Content</p>
      <p>
        Opportunities and content from partners remain their property. Partners
        grant Yoma permission to display their opportunities on the platform.
      </p>
      <p className="font-bold text-black">Credentials</p>
      <p>
        Credentials issued through YoID are cryptographically signed by the
        issuing organization. Yoma provides the infrastructure but does not
        claim ownership of credential content.
      </p>
      <p className="font-bold text-black">Open Source</p>
      <p>
        Some components of Yoma use open-source licenses. Those components are
        governed by their respective licenses (e.g., Creative Commons, MIT,
        Apache).
      </p>

      {/* Section 10 */}
      <h2 id="disclaimers-and-limitations">10. Disclaimers and Limitations</h2>
      <p className="font-bold text-black">Service &quot;As Is&quot;</p>
      <p>
        Yoma is provided &quot;as is&quot; and &quot;as available.&quot; We do
        not guarantee:
      </p>
      <ul className="list-inside list-disc">
        <li>Uninterrupted or error-free service</li>
        <li>Specific outcomes from using the platform</li>
        <li>That all opportunities will lead to employment</li>
        <li>Accuracy or reliability of third-party content</li>
      </ul>
      <p className="font-bold text-black">No Warranties</p>
      <p>
        To the fullest extent permitted by law, we disclaim all warranties,
        express or implied, including:
      </p>
      <ul className="list-inside list-disc">
        <li>Merchantability</li>
        <li>Fitness for a particular purpose</li>
        <li>Non-infringement</li>
      </ul>
      <p className="font-bold text-black">Partner Responsibility</p>
      <p>
        Yoma is a marketplace connecting youth and opportunity providers. We are
        not responsible for:
      </p>
      <ul className="list-inside list-disc">
        <li>The quality, accuracy, or legality of partner opportunities</li>
        <li>Partner fulfillment of promises or commitments</li>
        <li>Employment outcomes or credential recognition</li>
        <li>Disputes between youth and partners</li>
      </ul>
      <p>
        Always review partner terms and verify opportunity legitimacy before
        engaging.
      </p>
      <p className="font-bold text-black">Limitation of Liability</p>
      <p>To the maximum extent permitted by law:</p>
      <ul className="list-inside list-disc">
        <li>
          Yoma and RLabs are not liable for any indirect, incidental,
          consequential, or punitive damages
        </li>
        <li>
          Our total liability to you for any claims will not exceed the amount
          you paid to use Yoma (which is zero, as the platform is free)
        </li>
      </ul>
      <p>
        This limitation applies to claims based on contract, tort, negligence,
        strict liability, or any other legal theory.
      </p>
      <p className="font-bold text-black">Indemnification</p>
      <p>
        You agree to indemnify and hold harmless Yoma, RLabs, and our partners
        from any claims, damages, or expenses (including legal fees) arising
        from:
      </p>
      <ul className="list-inside list-disc">
        <li>Your use of the platform</li>
        <li>Your violation of these Terms</li>
        <li>Your infringement of others&apos; rights</li>
        <li>Content you post or share</li>
      </ul>

      {/* Section 11 */}
      <h2 id="changes-to-these-terms">11. Changes to These Terms</h2>
      <p className="font-bold text-black">Updates</p>
      <p>We may update these Terms to reflect:</p>
      <ul className="list-inside list-disc">
        <li>Changes in our services</li>
        <li>New features or functionality</li>
        <li>Legal or regulatory requirements</li>
        <li>Platform policy updates</li>
      </ul>
      <p className="font-bold text-black">Notification</p>
      <p>When we update these Terms, we will:</p>
      <ul className="list-inside list-disc">
        <li>Post the new version on the platform</li>
        <li>Update the &quot;Last Updated&quot; date</li>
        <li>
          Notify you through email or in-platform notification (for material
          changes)
        </li>
      </ul>
      <p className="font-bold text-black">Continued Use</p>
      <p>
        Your continued use of Yoma after changes take effect means you accept
        the updated Terms. If you disagree with changes, you must stop using the
        platform and may delete your account.
      </p>

      {/* Section 12 */}
      <h2 id="termination-and-account-deletion">
        12. Termination and Account Deletion
      </h2>
      <p className="font-bold text-black">Your Right to Leave</p>
      <p>You can delete your account at any time by:</p>
      <ul className="list-inside list-disc">
        <li>Using the account deletion feature in your settings, or</li>
        <li>
          Emailing{" "}
          <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
            admin@yoma.world
          </a>{" "}
          with your deletion request
        </li>
      </ul>
      <p>Upon deletion:</p>
      <ul className="list-inside list-disc">
        <li>Your account access is immediately revoked</li>
        <li>Your profile and personal data are deleted within 30 days</li>
        <li>
          Credentials stored in your YoID wallet remain under your control
          (self-sovereign)
        </li>
        <li>Some data may be retained in anonymized form for analytics</li>
        <li>ZLTO balances are forfeited (non-transferable)</li>
      </ul>
      <p className="font-bold text-black">Inactive Accounts</p>
      <p>To maintain platform security and data minimization:</p>
      <ul className="list-inside list-disc">
        <li>
          After <strong className="text-black">13 months of inactivity</strong>,
          we send a notification
        </li>
        <li>
          After <strong className="text-black">6 additional months</strong> (19
          months total inactivity), your account is automatically deleted
        </li>
        <li>You can prevent deletion by logging in at any time</li>
      </ul>
      <p className="font-bold text-black">Termination by Yoma</p>
      <p>We reserve the right to suspend or terminate accounts for:</p>
      <ul className="list-inside list-disc">
        <li>Serious violations of these Terms</li>
        <li>Fraudulent or illegal activity</li>
        <li>Harm to other users or the platform</li>
        <li>Court orders or legal requirements</li>
      </ul>
      <p>If we terminate your account for violations:</p>
      <ul className="list-inside list-disc">
        <li>
          You may not create a new account for{" "}
          <strong className="text-black">5 years</strong>
        </li>
        <li>Your data will be deleted per our standard process</li>
        <li>Outstanding ZLTO balances are forfeited</li>
        <li>Legal action may be pursued if warranted</li>
      </ul>

      {/* Section 13 */}
      <h2 id="contact-us">13. Contact Us</h2>
      <p className="font-bold text-black">Questions or Concerns</p>
      <p>
        If you have questions about these Terms or the platform, contact us:
      </p>
      <p>
        <strong className="text-black">Email:</strong>{" "}
        <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
          admin@yoma.world
        </a>
        <br />
        <strong className="text-black">Support:</strong>{" "}
        <a href="mailto:help@yoma.world" className="text-blue-600 underline">
          help@yoma.world
        </a>
      </p>
      <p>
        <strong className="text-black">RLabs (Yoma Data Controller)</strong>
        <br />
        54 Kiewiet Road, Bridgetown
        <br />
        Athlone 7764, Cape Town
        <br />
        Western Cape, South Africa
      </p>
      <p>
        <strong className="text-black">Privacy Compliance Officer:</strong>{" "}
        Desme Jacobs (
        {
          <a href="mailto:admin@yoma.world" className="text-blue-600 underline">
            admin@yoma.world
          </a>
        }
        )
      </p>
      <p className="font-bold text-black">Complaints</p>
      <p>If we cannot resolve your concern, you may file a complaint with:</p>
      <p>
        <strong className="text-black">
          Information Commissioner&apos;s Office (ICO)
        </strong>
        <br />
        Wycliffe House, Water Lane
        <br />
        Wilmslow, Cheshire, SK9 5AF
        <br />
        England, United Kingdom
        <br />
        <strong className="text-black">Tel:</strong> +44 303 123 1113
        <br />
        <strong className="text-black">Email:</strong>{" "}
        <a
          href="mailto:dataprotectionfee@ico.org.uk"
          className="text-blue-600 underline"
        >
          dataprotectionfee@ico.org.uk
        </a>
        <br />
        <strong className="text-black">Web:</strong>{" "}
        <a
          href="https://ico.org.uk/global/contact-us/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          https://ico.org.uk/global/contact-us/
        </a>
      </p>

      <h2>Governing Law</h2>
      <p>
        These Terms are governed by the laws of South Africa. Any disputes will
        be resolved in the courts of South Africa, except where your local laws
        provide you with additional protections.
      </p>

      <h2>Acknowledgment</h2>
      <p>
        By clicking &quot;I Agree,&quot; registering for, or using Yoma, you
        acknowledge that you have read, understood, and agree to be bound by
        these Terms of Service and our Privacy Policy.
      </p>
      <p>
        <strong className="text-black">
          Thank you for being part of the Yoma community. Together, we&apos;re
          building pathways from learning to earning for youth worldwide.
        </strong>
      </p>
      <p className="text-sm">&copy; 2025 Yoma. All Rights Reserved.</p>
    </div>
  );
};

export default TermsSection;
