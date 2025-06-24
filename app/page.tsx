"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FiLogIn, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
  const [matricula, setMatricula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!matricula.trim()) {
      setError('Por favor, digite sua matrícula.');
      setIsLoading(false);
      return;
    }

    try {
      const alunosRef = collection(db, 'alunos');
      const q = query(alunosRef, where("matricula", "==", matricula.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Matrícula não encontrada. Verifique os dados e tente novamente.');
      } else {
        const alunoDoc = querySnapshot.docs[0];
        const alunoData = alunoDoc.data();
        sessionStorage.setItem('alunoMatricula', alunoData.matricula);
        sessionStorage.setItem('alunoNome', alunoData.nome);
        sessionStorage.setItem('alunoGrupoId', alunoData.idGrupo);
        router.push('/avaliacao');
      }
    } catch (err) {
      console.error("Erro ao buscar aluno:", err);
      setError('Ocorreu um erro ao conectar com o servidor. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 bg-slate-100" 
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='%23e2e8f0'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")" }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="w-full">
          <Image
            src="/logo.png"
            alt="Ilustração do Projeto STEAM"
            width={1920}
            height={1080}
            layout="responsive"
            priority
          />
        </div>

        <div className="p-8 sm:p-10">
          <div className="w-full">
            {/* === BLOCO MODIFICADO === */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Autoavaliação de Performance</h1>
              <p className="mt-3 text-lg text-gray-500">Projeto COP 30 | Disciplina FIO 2025/1</p>
            </div>
            {/* ======================= */}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <FiLogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="matricula"
                  name="matricula"
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Digite sua matrícula"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-center text-red-600 font-medium">{error}</p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-x-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-transform hover:scale-105"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                  {!isLoading && <FiArrowRight size={20} />}
                </button>
              </div>
            </form>

              <footer className="mt-12 text-center text-gray-500 text-xs">
              <p>Site desenvolvido por Prof. Dr. Felipe Damas Melo.</p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}