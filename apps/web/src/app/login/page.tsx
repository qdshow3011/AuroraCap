import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--surface)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--primary-light)]/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--secondary)]/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}