import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, UserProfile } from '../services/firebase';
import { Shield, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface UserDoc extends UserProfile {
  id: string;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserDoc[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: UserDoc[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as UserDoc);
      });
      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'blocked' | 'pending') => {
    try {
      await updateDoc(doc(db, 'users', id), { status, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir usuário.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-sleek-border">
          <div className="flex items-center gap-3 text-sleek-text-main font-semibold text-[20px]">
            <Shield size={24} className="text-blue-500" />
            Painel Admin - Controle de Acessos
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-sleek-hover rounded-md text-sm font-medium hover:bg-gray-200 transition"
          >
            Voltar ao App
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-sleek-border rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                {u.foto ? (
                  <img src={u.foto} alt="Avatar" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sleek-hover flex items-center justify-center font-bold text-gray-500">
                    {u.nome?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sleek-text-main">{u.nome}</h3>
                  <div className="text-sm text-sleek-text-muted">{u.email}</div>
                  <div className="text-xs mt-1">
                    Status: 
                    <span className={`ml-1 font-semibold ${u.status === 'approved' ? 'text-green-600' : u.status === 'blocked' ? 'text-red-500' : 'text-orange-500'}`}>
                      {u.status.toUpperCase()}
                    </span>
                    {u.isAdmin && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">ADMIN</span>}
                  </div>
                </div>
              </div>
              
              {!u.isAdmin && (
                <div className="flex items-center gap-2">
                  {u.status !== 'approved' && (
                    <button 
                      onClick={() => handleUpdateStatus(u.id, 'approved')}
                      className="px-3 py-1.5 flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-md transition"
                    >
                      <CheckCircle size={14} /> Aprovar
                    </button>
                  )}
                  {u.status !== 'blocked' && (
                    <button 
                      onClick={() => handleUpdateStatus(u.id, 'blocked')}
                      className="px-3 py-1.5 flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded-md transition"
                    >
                      <XCircle size={14} /> Bloquear
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="px-3 py-1.5 flex items-center gap-1.5 text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md transition"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12 text-sleek-text-muted">Nenhum usuário cadastrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
