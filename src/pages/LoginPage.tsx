import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth';
import { Logo } from '../components/common';
import { useAuthStore } from '../stores';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-dark rounded-xl">
                <Logo variant="light" className="h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark">Tekrar Hoş Geldiniz</h1>
            <p className="text-gray-600 mt-2">
              Kurumsal AI Asistanınıza giriş yapın
            </p>
          </div>

          <LoginForm onSuccess={handleLoginSuccess} />

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Enterprise AI Assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
