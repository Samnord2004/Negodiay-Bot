import React, { useState } from 'react';
import { X, ShieldCheck, Key, Fingerprint, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Participant } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Participant | null;
  isAdmin: boolean;
  onPasswordChanged?: () => void;
}

export default function SecurityModal({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  onPasswordChanged
}: SecurityModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(currentUser?.biometricEnabled ?? true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('Новый пароль должен быть не менее 4 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Новый пароль и подтверждение не совпадают');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isAdmin && !currentUser ? '/api/admin/change-password' : '/api/auth/change-password';
      const body = isAdmin && !currentUser 
        ? { newPassword }
        : { userId: currentUser?.id || 'admin_user', oldPassword, newPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Пароль успешно изменен!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onPasswordChanged) onPasswordChanged();
      } else {
        setErrorMsg(data.error || 'Ошибка при изменении пароля');
      }
    } catch (err) {
      setErrorMsg('Сбой при обращении к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/toggle-biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, enabled })
      });
      if (res.ok) {
        setBiometricEnabled(enabled);
        setSuccessMsg(`Биометрия ${enabled ? 'включена' : 'выключена'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-red-600 w-6 h-6" />
            <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
              Безопасность и Пароли
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs text-red-800 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-100 border-2 border-emerald-500 rounded-xl text-xs text-emerald-800 font-bold flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Biometrics Settings */}
          {currentUser && (
            <div className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-emerald-600 w-6 h-6" />
                  <div>
                    <h4 className="font-black text-xs uppercase text-amber-950">Биометрическая защита</h4>
                    <p className="text-[11px] text-amber-700">Touch ID / Face ID на вашем устройстве</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={(e) => handleToggleBiometrics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h4 className="font-black text-xs uppercase text-red-700 flex items-center gap-1.5">
              <Lock size={14} /> Смена пароля {isAdmin ? '(Пароль Администратора)' : ''}
            </h4>

            {currentUser && !isAdmin && (
              <div>
                <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                Новый пароль
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 4 знака"
                className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                Повторите новый пароль
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Key size={14} />
              {loading ? 'Сохранение...' : 'Обновить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
