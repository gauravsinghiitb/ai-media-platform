import React from 'react';

const TermsAndConditions = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '2rem 1rem',
        fontFamily: 'sans-serif',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '900px', // Slightly wider than the original 3xl (768px) for better readability
          width: '100%',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem', // Slightly smaller than the 3xl (3rem) for consistency with other pages
            fontWeight: '700',
            marginBottom: '1.5rem',
          }}
        >
          Terms and Conditions
        </h1>
        <p
          style={{
            fontSize: '0.875rem', // Matches text-sm
            marginBottom: '1rem',
            fontWeight: '300',
          }}
        >
          Effective Date: June 01, 2025
        </p>

        <h2
          style={{
            fontSize: '1.25rem', // Matches text-xl
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          1. Acceptance of Terms
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          By signing up or using Kryoon in any capacity, you confirm that you have read, understood, and agreed to these Terms and our Privacy Policy. If you do not agree, you may not use the platform.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          2. Eligibility
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          You must be at least 13 years old to use Kryoon. By using the platform, you represent and warrant that you meet this requirement.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          3. User Authentication
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          Kryoon uses <strong>Google (Gmail) authentication</strong> for user sign-in and account management. You authorize Kryoon to access basic profile information from your Google account solely for login and profile-related functionalities.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          4. User Content and Ownership
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          You retain ownership of the content (including AI-generated images, videos, prompts, and other data) you upload or create on Kryoon. However, by posting or uploading content to the platform, you grant Kryoon a <strong>non-exclusive, royalty-free, worldwide, perpetual, irrevocable license</strong> to:
        </p>
        <ul
          style={{
            listStyleType: 'disc',
            paddingLeft: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Store, display, modify, remix, distribute, and publicly perform your content on or through the Kryoon platform;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Use your content (including prompts, models used, metadata, and generation process) for commercial and non-commercial purposes;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Re-upload or distribute your content through other media or platforms;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Create derivative works or compilations from your content;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Sell or sublicense access to your content as part of platform features, datasets, or partner services.
          </li>
        </ul>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          This license survives termination of your account. You confirm that you have the necessary rights to grant us this license for any content you post.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          5. Remixing and Contributions
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          Kryoon enables users to remix or contribute to existing AI-generated posts. When you remix someone else’s content, you must comply with platform guidelines. You acknowledge that remixed content may also be reused by Kryoon under the same license described above.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          6. Prohibited Activities
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          You agree not to:
        </p>
        <ul
          style={{
            listStyleType: 'disc',
            paddingLeft: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Upload or share content that violates intellectual property rights, privacy laws, or is illegal;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Attempt to gain unauthorized access to Kryoon’s systems;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Interfere with or disrupt the platform’s operations or other users’ experience;
          </li>
          <li style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.5', fontWeight: '300' }}>
            Misrepresent the source of generated content or impersonate another user.
          </li>
        </ul>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          7. Account Termination
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          We reserve the right to suspend or terminate your account at any time for violations of these Terms or to comply with legal obligations.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          8. Disclaimers
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          Kryoon is provided “as is” and without warranties of any kind. We do not guarantee that the platform will be uninterrupted, secure, or error-free. We are not responsible for the accuracy, legality, or reliability of AI-generated content shared by users.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          9. Limitation of Liability
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          To the fullest extent permitted by law, Kryoon shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the platform.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          10. Changes to the Terms
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          We may update these Terms from time to time. Continued use of the platform after changes go into effect constitutes your agreement to the revised Terms.
        </p>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginTop: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          11. Contact
        </h2>
        <p
          style={{
            marginBottom: '1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            fontWeight: '300',
          }}
        >
          For questions regarding these Terms, please contact us at:{' '}
          <a
            href="mailto:support@kryoon.com"
            style={{
              color: '#FFFFFF',
              textDecoration: 'none',
              borderBottom: '1px solid #FFFFFF',
            }}
          >
            support@kryoon.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;