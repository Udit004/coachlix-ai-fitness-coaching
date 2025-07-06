export default function Head() {
  return (
    <>
      <title>Coachlix AI Fitness Coaching</title>
      <meta name="description" content="Your AI-powered personal fitness coach. Track your progress, get personalized plans, and stay motivated with Coachlix." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />

      {/* PWA manifest and icons */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <link rel="icon" href="/icon-192.png" />

      {/* Open Graph for social sharing */}
      <meta property="og:title" content="Coachlix AI Fitness Coaching" />
      <meta property="og:description" content="Your AI fitness coach with personalized plans." />
      <meta property="og:image" content="/icon-512.png" />
      <meta property="og:type" content="website" />
    </>
  );
}
