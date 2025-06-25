'use client';

import { useState, FormEvent } from 'react';
import { signIn, registerUser, signInWithGoogle, signOut } from '../firebase/auth';
import { User } from 'firebase/auth';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await signIn(email, password);
    
    if (result.error) {
      setError(result.error);
    } else {
      setUser(result.user);
      setEmail('');
      setPassword('');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await registerUser(email, password);
    
    if (result.error) {
      setError(result.error);
    } else {
      setUser(result.user);
      setEmail('');
      setPassword('');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    const result = await signInWithGoogle();
    
    if (result.error) {
      setError(result.error);
    } else {
      setUser(result.user);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    
    const result = await signOut();
    
    if (result.error) {
      setError(result.error);
    } else {
      setUser(null);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {user ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Bienvenido</h2>
          <p className="mb-2"><strong>Email:</strong> {user.email}</p>
          <p className="mb-4"><strong>ID:</strong> {user.uid}</p>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSignIn} className="mb-4">
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-1">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
          <div className="text-center">
            <p className="mb-2">O</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}