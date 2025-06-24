"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// --- DEFINIÇÃO DOS TIPOS DE DADOS E CRITÉRIOS ---

type Aluno = {
  id: string;
  matricula: string;
  nome: string;
};

type NotasPorCriterio = {
  [criterio: string]: number;
};

type Avaliacao = {
  avaliadorMatricula: string;
  avaliadoMatricula: string;
  notas: NotasPorCriterio;
  respostaDissertativa?: string;
  perguntaFeita?: string;
};

// MODIFICADO: Adicionamos o campo 'hasResponded'
type AlunoComResultados = Aluno & {
  pontosProcesso: number;
  pontosExecucao: number;
  pergunta: string;
  autoavaliacao: string;
  hasResponded: boolean;
};

const CRITERIOS_PROCESSO = ['comunicacao', 'comprometimento', 'trabalhoEquipe'];
const CRITERIOS_EXECUCAO = ['qualidade', 'proatividade', 'presenca'];

// --- SENHA DE ACESSO ---
const SENHA_CORRETA = "123456"; // Lembre-se de mudar esta senha

export default function AdminPage() {
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  
  const [alunos, setAlunos] = useState<AlunoComResultados[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaDigitada === SENHA_CORRETA) {
      setAutenticado(true);
    } else {
      alert("Senha incorreta!");
    }
  };

  useEffect(() => {
    if (!autenticado) return;

    const fetchData = async () => {
      try {
        const alunosSnapshot = await getDocs(collection(db, 'alunos'));
        const listaAlunos: Aluno[] = alunosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Aluno));

        const avaliacoesSnapshot = await getDocs(collection(db, 'avaliacoes'));
        const listaAvaliacoes: Avaliacao[] = avaliacoesSnapshot.docs.map(doc => doc.data() as Avaliacao);

        const alunosProcessados = listaAlunos.map(aluno => {
          // MODIFICADO: Lógica para verificar se o aluno já respondeu
          const hasResponded = listaAvaliacoes.some(
            aval => aval.avaliadorMatricula === aluno.matricula
          );

          // Lógica de cálculo de notas (permanece a mesma)
          const avaliacoesRecebidas = listaAvaliacoes.filter(
            aval => aval.avaliadoMatricula === aluno.matricula
          );
          
          const mediasCriterios: { [key: string]: number } = {};
          const todosCriterios = [...CRITERIOS_PROCESSO, ...CRITERIOS_EXECUCAO];
          todosCriterios.forEach(criterio => {
            const notasDoCriterio = avaliacoesRecebidas
              .map(aval => aval.notas?.[criterio])
              .filter(nota => typeof nota === 'number');
            if (notasDoCriterio.length > 0) {
              const soma = notasDoCriterio.reduce((acc, nota) => acc + nota, 0);
              mediasCriterios[criterio] = soma / notasDoCriterio.length;
            } else {
              mediasCriterios[criterio] = 0;
            }
          });

          const somaMediasProcesso = CRITERIOS_PROCESSO.reduce((acc, crit) => acc + mediasCriterios[crit], 0);
          const pontosProcesso = (somaMediasProcesso / (CRITERIOS_PROCESSO.length * 5)) * 2.5;
          const somaMediasExecucao = CRITERIOS_EXECUCAO.reduce((acc, crit) => acc + mediasCriterios[crit], 0);
          const pontosExecucao = (somaMediasExecucao / (CRITERIOS_EXECUCAO.length * 5)) * 2.5;
          const autoavaliacaoDoc = avaliacoesRecebidas.find(
            aval => aval.avaliadoMatricula === aval.avaliadorMatricula
          );

          // MODIFICADO: Retorna o objeto completo com o status
          return {
            ...aluno,
            pontosProcesso: pontosProcesso,
            pontosExecucao: pontosExecucao,
            pergunta: autoavaliacaoDoc?.perguntaFeita || "Nenhuma pergunta registrada.",
            autoavaliacao: autoavaliacaoDoc?.respostaDissertativa || "Nenhuma resposta enviada.",
            hasResponded: hasResponded 
          };
        });

        setAlunos(alunosProcessados);

      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
        setError("Falha ao carregar os dados. Verifique as permissões do Firestore.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [autenticado]);

  // --- RENDERIZAÇÃO ---
  if (!autenticado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-center">Acesso Restrito</h1>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              placeholder="Digite a senha"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Entrar
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (isLoading) return <main className="text-center p-10">Carregando dados...</main>;
  if (error) return <main className="text-center p-10 text-red-500">{error}</main>;

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800">Painel do Professor</h1>
        <p className="mt-2 text-lg text-gray-600">Resultados e Status da Autoavaliação</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alunos
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((aluno) => (
            // MODIFICADO: O className agora é condicional para mudar a cor
            <div 
              key={aluno.id} 
              className={`p-6 rounded-lg shadow-md hover:shadow-xl transition-all flex flex-col border-2 
                ${aluno.hasResponded 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
                }`}
            >
              <h2 className="text-xl font-bold text-gray-900">{aluno.nome}</h2>
              
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Habilidades de Processo:</p>
                  <p className="text-2xl font-light text-indigo-600">
                    {aluno.pontosProcesso.toFixed(2)} / 2.5
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Habilidades de Execução:</p>
                  <p className="text-2xl font-light text-green-600">
                    {aluno.pontosExecucao.toFixed(2)} / 2.5
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex-grow flex flex-col">
                <p className="font-semibold text-gray-800">{aluno.pergunta}</p>
                <div className="mt-1 text-sm text-gray-700 bg-white p-3 rounded-md h-32 overflow-y-auto flex-grow">
                  {aluno.autoavaliacao}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}