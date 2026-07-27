import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Contrakr",
  description: "What Contrakr collects, why, and what we do with it.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="!text-[#6B7280] dark:!text-[#94A3B8] !text-sm">Last updated: July 27, 2026</p>

      <p>
        Contrakr is a marketplace that connects homeowners with local contractors. It is operated
        by an individual based in Tupelo, Mississippi. This policy explains what we collect, why we
        collect it, and what we do with it — in plain language.
      </p>
      <p>
        <strong>We do not sell your personal information, and we never have.</strong> We don&apos;t
        run advertising, and we don&apos;t use analytics or tracking services of any kind.
      </p>

      <h2>What we collect</h2>
      <p>Information you give us when you create an account and use the site:</p>
      <ul>
        <li><strong>Account details</strong> — your name, email address, phone number, and password.</li>
        <li><strong>Profile information</strong> — your city and state, profile photo, and bio.</li>
        <li>
          <strong>Contractor details</strong>, if you sign up as a contractor — business name, years
          in business, website, service categories, service areas, and license number if you provide one.
        </li>
        <li>
          <strong>Content you post</strong> — job listings, feed posts, photos, comments, likes, bids,
          reviews, and messages you send to other users.
        </li>
        <li>
          <strong>Approximate location coordinates</strong> derived from the city and state you enter.
          We use these to show you jobs and contractors near you. We do not use your device&apos;s GPS
          and we do not track your location.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and let you sign in.</li>
        <li>To show your posts, profile, and reviews to other users.</li>
        <li>To match jobs and contractors by distance, using the search radius you choose.</li>
        <li>To send you notifications about messages, bids, comments, and reviews.</li>
        <li>To respond to you when you contact us for support.</li>
      </ul>

      <h2>What other people can see</h2>
      <p>
        Contrakr is a public marketplace, so some of what you enter is visible to others by design.
        Your name, profile photo, city and state, bio, and anything you post publicly — jobs, feed
        posts, photos, comments, and reviews — can be seen by other signed-in users.
      </p>
      <p>
        Your email address and password are never shown to other users. Your phone number is shown
        only if you choose to add it to a contractor profile, where its purpose is to let customers
        reach you.
      </p>
      <p>
        Direct messages are visible only to you and the person you&apos;re messaging. They are not
        end-to-end encrypted, which means they are stored on our database and could in principle be
        read by us. We don&apos;t read them as a matter of practice, but we may need to look at
        specific messages to investigate a report of abuse or fraud.
      </p>

      <h2>Services we rely on</h2>
      <p>
        We use a small number of outside providers to operate the site. They handle your data only
        to provide their service to us:
      </p>
      <ul>
        <li><strong>Supabase</strong> — stores the database, your account, and uploaded photos.</li>
        <li><strong>Vercel</strong> — hosts the website and serves it to your browser.</li>
        <li><strong>Resend</strong> — sends notification emails to your address.</li>
        <li>
          <strong>OpenStreetMap / Nominatim</strong> — converts the city and state you type into map
          coordinates. The location text you enter is sent to their service to do this.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use cookies for one purpose: keeping you signed in. There are no advertising cookies, no
        tracking pixels, and no third-party analytics cookies on this site. Clearing them will sign
        you out.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit or correct your profile information at any time in Settings.</li>
        <li>You can delete your own posts, photos, and comments.</li>
        <li>
          You can ask us to delete your account and personal data by emailing{" "}
          <a href="mailto:devcontrakr@gmail.com">devcontrakr@gmail.com</a>. We&apos;ll action it
          within 30 days.
        </li>
      </ul>
      <p>
        One caveat on deletion: reviews you&apos;ve left may remain visible, with your name removed,
        because deleting them would distort another user&apos;s rating history.
      </p>

      <h2>Data security</h2>
      <p>
        Your password is hashed — we never see or store it in readable form. Data is transmitted over
        HTTPS and access to the database is restricted by row-level security rules. That said, no
        online service can promise perfect security, and we&apos;d be lying if we told you otherwise.
      </p>

      <h2>Children</h2>
      <p>
        Contrakr is not intended for anyone under 18. We don&apos;t knowingly collect information
        from minors. If you believe a minor has created an account, email us and we&apos;ll remove it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we make a meaningful change, we&apos;ll update the date at the top of this page. If the
        change materially affects how we handle your information, we&apos;ll notify you by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy, or a request to delete your data:{" "}
        <a href="mailto:devcontrakr@gmail.com">devcontrakr@gmail.com</a>
      </p>
    </>
  );
}
