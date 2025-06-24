"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'; // 1. Adicione esta importação
import { FaCheckCircle, FaAward } from 'react-icons/fa';

export default function SucessoPage() {
  const [nomeAluno, setNomeAluno] = useState('');

  // Pega o nome do aluno da sessionStorage para personalizar a mensagem
  useEffect(() => {
    const nome = sessionStorage.getItem('alunoNome');
    if (nome) {
      setNomeAluno(nome.split(' ')[0]);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 p-4 text-center">
      <div className="w-full max-w-2xl transform transition-all">
        
        {/* Card de Confirmação Técnica */}
        <div className="p-8 bg-white rounded-t-2xl shadow-lg space-y-4">
          <div className="flex justify-center">
            <FaCheckCircle className="text-6xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Obrigado, {nomeAluno}!
          </h1>
          <p className="text-lg text-gray-600">
            Sua avaliação foi enviada com sucesso.
          </p>
        </div>

        {/* Card de Mensagem do Professor */}
        <div className="p-8 bg-indigo-600 text-white rounded-b-2xl shadow-lg space-y-4 border-t-4 border-indigo-700">
          <div className="flex justify-center">
             <FaAward className="text-5xl text-yellow-300" />
          </div>
          <h2 className="text-2xl font-semibold">Uma mensagem dos seus professores</h2>
          <p className="text-lg leading-relaxed max-w-prose mx-auto">
            Este foi um trabalho incrível e desafiador. Sabemos do esforço e da dedicação de cada um, e estamos muito satisfeitos com a qualidade e os resultados que vocês alcançaram. Parabéns pelo excelente projeto!
          </p>

          <p className="text-right font-semibold italic mt-4 pr-4">
            Professores Felipe e Waguinho.
          </p>
        </div>

        {/* 2. ADICIONE ESTE BLOCO DE CÓDIGO PARA O BOTÃO */}
        <div className="mt-8 flex justify-center">
            <Link 
                href="/" 
                className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Voltar para a Página Inicial
            </Link>
        </div>

      </div>
    </main>
  );
}