import React from "react";

const TermsSection = () => {
  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      <h1
        className="font-nunito scroll-mt-24 text-xl font-bold md:text-3xl"
        id="terms-top"
      >
        Terms of Service
      </h1>
      <p className="text-gray-dark text-sm">Last updated: January 2026</p>

      <div className="flex flex-col gap-4">
        <p className="text-gray-dark text-sm md:text-base">
          Thank you for your interest in Yoma. These Terms of Service govern
          your use of the Yoma platform, available at{" "}
          <a
            href="https://yoma.world/"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://yoma.world/
          </a>{" "}
          and{" "}
          <a
            href="https://yoma.africa/"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://yoma.africa/
          </a>
          , including all related APIs and services (collectively, the
          &quot;Platform&quot; or &quot;Services&quot;).
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          <strong>
            By registering for or using Yoma, you agree to these Terms.
          </strong>
          &nbsp;Please read them carefully.
        </p>
      </div>

      <div className="font-nunito flex flex-col gap-2 text-sm md:text-base">
        <h2 className="text-lg font-bold text-black">Table of Contents</h2>
        <ol className="list-inside list-decimal font-semibold">
          <li>
            <a href="#terms-1-about-yoma" className="hover:underline">
              About Yoma
            </a>
          </li>
          <li>
            <a href="#terms-2-who-can-use" className="hover:underline">
              Who Can Use Yoma
            </a>
          </li>
          <li>
            <a href="#terms-3-registration" className="hover:underline">
              Registration and Your Account
            </a>
          </li>
          <li>
            <a href="#terms-4-how-yoma-works" className="hover:underline">
              How Yoma Works
            </a>
          </li>
          <li>
            <a href="#terms-5-rights" className="hover:underline">
              Your Rights and Responsibilities
            </a>
          </li>
          <li>
            <a href="#terms-6-partners" className="hover:underline">
              Partner Roles and Permissions
            </a>
          </li>
          <li>
            <a href="#terms-7-privacy" className="hover:underline">
              Privacy and Data Protection
            </a>
          </li>
          <li>
            <a href="#terms-8-rules" className="hover:underline">
              Platform Rules and Prohibited Conduct
            </a>
          </li>
          <li>
            <a href="#terms-9-ip" className="hover:underline">
              Intellectual Property
            </a>
          </li>
          <li>
            <a href="#terms-10-disclaimers" className="hover:underline">
              Disclaimers and Limitations
            </a>
          </li>
          <li>
            <a href="#terms-11-changes" className="hover:underline">
              Changes to These Terms
            </a>
          </li>
          <li>
            <a href="#terms-12-termination" className="hover:underline">
              Termination and Account Deletion
            </a>
          </li>
          <li>
            <a href="#terms-13-contact" className="hover:underline">
              Contact Us
            </a>
          </li>
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-1-about-yoma"
        >
          1. About Yoma
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma is a youth agency marketplace operated by RLabs, a non-profit
          organization based in South Africa. We connect young people with
          opportunities for skills development, impact work, and employment.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma is free to use for youth and partners and is supported by UNICEF,
          Generation Unlimited, and a network of partners.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-2-who-can-use"
        >
          2. Who Can Use Yoma
        </h2>
        <p className="font-semibold text-black">Age requirements</p>
        <ul className="text-gray-dark ml-4 list-disc text-sm md:text-base">
          <li>Youth aged 16 and older may register and use the Platform.</li>
          <li>
            Youth under 16 may only use the Platform with approval from a parent
            or legal guardian.
          </li>
          <li>
            Organizations (including opportunity providers and employers) may
            use Yoma to publish or manage opportunities.
          </li>
        </ul>
        <p className="text-gray-dark text-sm md:text-base">
          If you are a parent or guardian and believe a child has created an
          unauthorized account, contact us at{" "}
          <a
            href="mailto:admin@yoma.world"
            className="text-blue-600 hover:underline"
          >
            admin@yoma.world
          </a>{" "}
          and we will take appropriate action.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-3-registration"
        >
          3. Registration and Your Account
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          To use Yoma you must register for an account. Account creation is
          handled through our identity provider and typically requires a
          username identifier (which can be an email address or phone number)
          and a password. Depending on your sign-in method, a phone-based
          one-time password (OTP) step may be required.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Some Platform features require profile completion. The Platform may
          ask you to provide additional information such as your first name,
          surname, country, education, gender, and date of birth.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account. If you suspect unauthorized access, contact{" "}
          <a
            href="mailto:admin@yoma.world"
            className="text-blue-600 hover:underline"
          >
            admin@yoma.world
          </a>
          .
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-4-how-yoma-works"
        >
          4. How Yoma Works
        </h2>
        <p className="font-semibold text-black">Opportunities</p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma lists opportunities from partners, such as learning
          opportunities, impact opportunities, and employment opportunities.
          Many opportunities take place on partner platforms, and Yoma may
          redirect you to a partner&apos;s site to participate.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma does not automatically pre-fill partner applications end-to-end
          as a default product behavior. Some partners may implement their own
          integration (for example, single sign-on using industry-standard OIDC)
          to receive user-authorized information on their side.
        </p>
        <p className="font-semibold text-black">YoID (credentials)</p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma supports verifiable credentials (YoID) issued by organizations.
          Credentials are cryptographically signed by the issuer and follow
          industry standards (including ARC and JWT credentials). Yoma
          integrates with an external wallet service to support credential
          workflows and may store credential metadata (and, for some credential
          types, signed payload data) needed to provide the service.
        </p>
        <p className="font-semibold text-black">ZLTO (rewards)</p>
        <p className="text-gray-dark text-sm md:text-base">
          Some opportunities may reward you with ZLTO. You may be able to redeem
          ZLTO for goods or services through marketplace-related integrations.
          Availability varies by region and partner.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-5-rights"
        >
          5. Your Rights and Responsibilities
        </h2>
        <p className="font-semibold text-black">Your responsibilities</p>
        <ul className="text-gray-dark ml-4 list-disc text-sm md:text-base">
          <li>Provide accurate information and keep it up to date.</li>
          <li>Use Yoma only for legitimate purposes.</li>
          <li>Keep your account secure and do not share credentials.</li>
          <li>Follow all applicable laws and these Terms.</li>
        </ul>
        <p className="font-semibold text-black">Your rights</p>
        <p className="text-gray-dark text-sm md:text-base">
          You may access and update your profile information via the Platform
          where available. You may also contact us to exercise data protection
          rights described in the Privacy Policy.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-6-partners"
        >
          6. Partner Roles and Permissions
        </h2>
        <p className="font-semibold text-black">Youth users</p>
        <p className="text-gray-dark text-sm md:text-base">
          Youth users can browse and participate in opportunities and may
          receive rewards or credentials depending on the opportunity.
        </p>
        <p className="font-semibold text-black">
          Opportunity providers and employers
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Partners may receive limited information where required to administer
          an opportunity or verification flow. In particular, for eligible
          verified completions, and where an opportunity is configured to share
          and your sharing settings allow it, partners may receive opted-in
          contact information (such as username, email, phone number) and
          completion information (such as date completed).
        </p>
        <p className="font-semibold text-black">
          Marketplace-related providers
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Marketplace-related transactions are processed with the information
          required to fulfill the redemption, such as wallet identifiers, item
          identifiers, and transaction references.
        </p>
        <p className="font-semibold text-black">Yoma technical team</p>
        <p className="text-gray-dark text-sm md:text-base">
          Authorized members of the Yoma development and support team may access
          systems and data for troubleshooting, maintenance, and investigating
          misuse. Such access is limited to what is necessary and is subject to
          internal controls.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-7-privacy"
        >
          7. Privacy and Data Protection
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          We process personal data to provide the Platform and Services, support
          opportunities and verification, process rewards/redemptions, and
          improve the Platform.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma uses analytics and monitoring tools to understand Platform usage
          and improve reliability. These tools are controlled by user consent:
          when you do not consent, these tools are not initialized.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Our primary hosting location is Amazon Web Services (AWS) Europe
          (Ireland) region (eu-west-1).
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          For more details on what we collect, how we use it, and your rights,
          please review the Privacy Policy in the &quot;Privacy Policy&quot;
          tab.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-8-rules"
        >
          8. Platform Rules and Prohibited Conduct
        </h2>
        <p className="font-semibold text-black">You may not:</p>
        <ul className="text-gray-dark ml-4 list-disc text-sm md:text-base">
          <li>Impersonate others or create fraudulent accounts.</li>
          <li>Harass, threaten, or abuse other users.</li>
          <li>
            Upload illegal content or content that is harmful or offensive.
          </li>
          <li>Attempt to gain unauthorized access to systems or data.</li>
          <li>
            Distribute malware or use automated systems without authorization.
          </li>
        </ul>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-9-ip"
        >
          9. Intellectual Property
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          The Platform and its content (including software, text, and design)
          are owned by RLabs or licensed to us. You may not copy, modify,
          distribute, or reverse-engineer Platform content except as permitted
          by law.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Credentials issued through YoID are signed by the issuing
          organization. Yoma provides the infrastructure to support credential
          workflows but does not claim ownership of credential content.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-10-disclaimers"
        >
          10. Disclaimers and Limitations
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          The Platform is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. We do not guarantee uninterrupted or error-free
          operation or specific outcomes from using the Platform.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          Yoma connects youth and partners and is not responsible for the
          accuracy, legality, or quality of third-party opportunities or
          content.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          To the maximum extent permitted by law, Yoma and RLabs are not liable
          for indirect or consequential damages. Since the Platform is free, our
          total liability to you for any claim will not exceed the amount you
          paid to use the Platform (which is zero).
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-11-changes"
        >
          11. Changes to These Terms
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          We may update these Terms from time to time. When we do, we will post
          the updated Terms and update the &quot;Last updated&quot; date. If the
          changes are material, we may also notify you through the Platform or
          by email.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-12-termination"
        >
          12. Termination and Account Deletion
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          We may suspend or terminate access to the Platform for serious
          violations of these Terms, fraudulent or illegal activity, or where
          required by law.
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          There is currently no self-service in-product account deletion flow.
          You may request account deletion by contacting{" "}
          <a
            href="mailto:admin@yoma.world"
            className="text-blue-600 hover:underline"
          >
            admin@yoma.world
          </a>
          . We may retain certain information where required for security, fraud
          prevention, dispute resolution, or legal compliance.
        </p>

        <h2
          className="scroll-mt-24 text-base font-semibold text-black md:text-lg"
          id="terms-13-contact"
        >
          13. Contact Us
        </h2>
        <p className="text-gray-dark text-sm md:text-base">
          Email:{" "}
          <a
            href="mailto:admin@yoma.world"
            className="text-blue-600 hover:underline"
          >
            admin@yoma.world
          </a>{" "}
          (official contact)
          <br />
          Support:{" "}
          <a
            href="mailto:help@yoma.world"
            className="text-blue-600 hover:underline"
          >
            help@yoma.world
          </a>
        </p>
        <p className="text-gray-dark text-sm md:text-base">
          RLabs (Yoma Data Controller)
          <br />
          54 Kiewiet Road, Bridgetown
          <br />
          Athlone 7764, Cape Town
          <br />
          Western Cape, South Africa
        </p>

        <h2 className="text-lg font-bold text-black">Governing Law</h2>
        <p className="text-gray-dark text-sm md:text-base">
          These Terms are governed by the laws of South Africa, subject to any
          mandatory protections provided by your local laws.
        </p>

        <p className="text-gray-dark text-sm md:text-base">
          By registering for or using Yoma, you acknowledge that you have read,
          understood, and agree to be bound by these Terms and the Privacy
          Policy.
        </p>
      </div>
    </div>
  );
};

export default TermsSection;
