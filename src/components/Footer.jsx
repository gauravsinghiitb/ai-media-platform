function Footer() {
  return (
    <>
      <style>
        {`
          .footer {
            background: linear-gradient(to right, #1f2937, #111827);
            padding: 1.5rem;
            text-align: center;
            color: #9ca3af;
            font-size: 0.9rem;
            border-top: 1px solid #374151;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
          }
        `}
      </style>

      <footer className="footer">
        © 2025 AI Platform | A Space for AI Creativity
      </footer>
    </>
  );
}

export default Footer;