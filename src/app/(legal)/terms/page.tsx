import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Contrakr",
  description: "The rules for using Contrakr.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="!text-[#6B7280] dark:!text-[#94A3B8] !text-sm">Last updated: July 27, 2026</p>

      <p>
        These terms are an agreement between you and Contrakr, a service operated by an individual
        based in Tupelo, Mississippi. By creating an account or using the site, you agree to them.
        If you don&apos;t agree, please don&apos;t use Contrakr.
      </p>

      <h2>What Contrakr is — and isn&apos;t</h2>
      <p>
        Contrakr is a place where homeowners post jobs and contractors respond to them. That is the
        whole of what we do.
      </p>
      <p>
        <strong>We are not a party to any agreement you make with another user.</strong> We are not a
        contractor, a general contractor, a broker, or an employer. We don&apos;t supervise work,
        set prices, guarantee quality, or hold anyone&apos;s money. When a homeowner hires a
        contractor through Contrakr, that contract is between the two of them, and any dispute is
        theirs to resolve.
      </p>

      <h2>Who can use it</h2>
      <p>
        You must be at least 18 and legally able to enter into contracts. One account per person.
        You&apos;re responsible for keeping your password secure and for everything that happens
        under your account.
      </p>

      <h2>Verification badges — what they actually mean</h2>
      <p>
        Some contractor profiles carry badges. Here is precisely what each one represents, because
        it would be easy to read more into them than is there:
      </p>
      <ul>
        <li>
          <strong>Verified</strong> — we&apos;ve confirmed the business appears to be a real,
          operating business.
        </li>
        <li>
          <strong>Licensed</strong> — we&apos;ve manually checked the license number provided against
          the relevant state licensing board <em>at the time we checked</em>.
        </li>
        <li><strong>Day One</strong> and <strong>Founder</strong> — these mark early members. They say nothing about qualifications.</li>
      </ul>
      <p>
        A badge is not a guarantee, an endorsement, or a warranty. Licenses expire, get suspended, or
        change scope, and we may not learn of it. <strong>Before hiring anyone, verify their license
        and insurance yourself</strong> with your state licensing board. That check is worth the ten
        minutes it takes.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you post. By posting it, you give us permission to display and
        distribute it on Contrakr so the service can function.
      </p>
      <p>Only post content you have the right to post. Don&apos;t upload photos of work that isn&apos;t yours.</p>

      <h2>Rules of the road</h2>
      <p>Don&apos;t use Contrakr to:</p>
      <ul>
        <li>Misrepresent who you are, your qualifications, your licensing, or your insurance.</li>
        <li>Post work photos that aren&apos;t your own, or reviews that aren&apos;t genuine.</li>
        <li>Harass, threaten, or discriminate against other users.</li>
        <li>Scam, defraud, or attempt to move people off-platform to defraud them.</li>
        <li>Spam the feed or messages with unsolicited advertising.</li>
        <li>Post anything illegal, or scrape the site with automated tools.</li>
      </ul>
      <p>
        We may remove content or suspend accounts that break these rules. For clear fraud or safety
        problems, we&apos;ll do it without warning.
      </p>

      <h2>Reviews</h2>
      <p>
        Reviews must reflect a real experience with a real job. Don&apos;t write reviews for
        yourself, trade them with other users, pay for them, or use them for revenge unrelated to
        the work. We remove reviews we determine to be fake, and repeat offenders lose their accounts.
      </p>

      <h2>Fees</h2>
      <p>
        Contrakr is currently free for everyone. If that changes, we&apos;ll give clear notice
        beforehand, and you&apos;ll never be charged without agreeing first.
      </p>
      <p>
        We don&apos;t process payments between users. Any money that changes hands for a job is
        arranged directly between the homeowner and the contractor, using whatever method they agree
        on. We have no visibility into it and no ability to refund, reverse, or mediate it.
      </p>

      <h2>No warranty</h2>
      <p>
        Contrakr is provided as-is. We don&apos;t warrant that the service will be uninterrupted or
        error-free, and we don&apos;t warrant the accuracy of anything users post — including
        profiles, credentials, job descriptions, bids, and reviews.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, Contrakr is not liable for any indirect, incidental, or
        consequential damages arising from your use of the service, from anything another user does
        or fails to do, or from any work performed or not performed as a result of a connection made
        here.
      </p>
      <p>
        <strong>Hiring decisions are yours.</strong> Check licenses, confirm insurance, get written
        estimates, and use your judgment — exactly as you would with a contractor you found any
        other way.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using Contrakr whenever you like, and you can request deletion of your account
        by emailing us. We may suspend or terminate accounts that violate these terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Mississippi, without regard to its
        conflict-of-law rules.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. We&apos;ll change the date at the top, and for significant changes
        we&apos;ll notify you by email. Continuing to use Contrakr after a change means you accept it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:devcontrakr@gmail.com">devcontrakr@gmail.com</a>
      </p>
    </>
  );
}
