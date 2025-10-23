
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ICONS } from '../constants';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('coach@kondisca.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      // The redirect is handled by the main App router
    } catch (err) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePlayerLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setEmail('player@kondisca.com');
    setPassword('password');
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4" style={{backgroundImage: 'url(https://picsum.photos/seed/bball-court/1920/1080)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="relative w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg z-10">
        <div className="text-center">
            <h1 className="text-4xl font-black text-primary">Kondisca</h1>
            <p className="mt-2 text-text-dark">Performansını Zirveye Taşı</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-background placeholder-gray-500 text-text-light rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-background placeholder-gray-500 text-text-light rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-500"
            >
              {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>
           <div className="flex items-center justify-center">
            <button
                type="button"
                onClick={handlePlayerLogin}
                className="text-sm text-primary hover:underline"
            >
                Oyuncu olarak giriş yapmak için buraya tıklayın
            </button>
           </div>
        </form>
        
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-text-dark">Veya</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <div>
            <button
              type="button"
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-transparent hover:bg-gray-700 focus:outline-none"
            >
              {ICONS.GOOGLE}
              <span className="ml-2">Google ile Giriş Yap</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
