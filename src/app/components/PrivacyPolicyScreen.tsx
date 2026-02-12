import { ArrowLeft } from "lucide-react";

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto space-y-6 text-sm text-muted-foreground leading-relaxed overflow-y-auto">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
          <p>
            Welcome to Atomiq ("we," "our," or "us"). We are committed to
            protecting your personal information and your right to privacy. This
            Privacy Policy explains how we collect, use, and share your
            information when you use our mobile application and services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p>
            We collect information that you voluntarily provide to us when you
            register on the application, such as your:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name and Email address</li>
            <li>Profile information (username, avatar)</li>
            <li>Habit data (goals, completions, streaks)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <p>
            We use personal information collected via our app for a variety of
            business purposes described below:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To facilitate account creation and logon process.</li>
            <li>To send you administrative information.</li>
            <li>To enable user-to-user communications (e.g., squads).</li>
            <li>To enforce our terms, conditions, and policies.</li>
            <li>To improve your experience and our services.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            4. Sharing Your Information
          </h2>
          <p>
            We only share information with your consent, to comply with laws, to
            provide you with services, to protect your rights, or to fulfill
            business obligations. We do not sell your personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            5. Data Security
          </h2>
          <p>
            We have implemented appropriate technical and organizational security
            measures designed to protect the security of any personal
            information we process. However, please also remember that we cannot
            guarantee that the internet itself is 100% secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            6. Contact Us
          </h2>
          <p>
            If you have questions or comments about this policy, you may email us
            at support@atomiq.club.
          </p>
        </section>
        
        <div className="pt-8 text-center text-xs opacity-50">
             &copy; {new Date().getFullYear()} Atomiq. All rights reserved.
        </div>
      </div>
    </div>
  );
}
