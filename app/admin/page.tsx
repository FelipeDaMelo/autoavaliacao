"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// --- DEFINIÇÃO DOS TIPOS DE DADOS E CRITÉRIOS ---2563

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

type Grupo = {
  id: string;
  membros: string[];
  youtubeLink?: string;
  notasVideo?: number[];
};

// MODIFICADO: Adicionamos o campo 'hasResponded'
type AlunoComResultados = Aluno & {
  pontosProcesso: number;
  pontosExecucao: number;
  pergunta: string;
  autoavaliacao: string;
  hasResponded: boolean;
  youtubeLink?: string;
  idGrupo?: string;
  notasVideo?: number[];
};

const CRITERIOS_PROCESSO = ['comunicacao', 'comprometimento', 'trabalhoEquipe'];
const CRITERIOS_EXECUCAO = ['qualidade', 'proatividade', 'presenca'];

// --- RUBRICA DO VÍDEO STEAM ---
const RUBRICA_CRITERIOS = [
  "Articulação com STEAM e ODS",
  "Clareza e Criatividade",
  "Fundamentação e Impacto",
  "Trabalho em Equipe"
];
const VALORES_PERCENTUAIS = [0, 25, 50, 100];
const VALOR_POR_CRITERIO = 0.625; // 2.5 pontos / 4 critérios

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

        const gruposSnapshot = await getDocs(collection(db, 'grupos'));
        const listaGrupos = gruposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grupo));

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

          const grupoDoAluno = listaGrupos.find(g => g.membros && g.membros.includes(aluno.matricula));

          // MODIFICADO: Retorna o objeto completo com o status, link do youtube e rubrica
          return {
            ...aluno,
            pontosProcesso: pontosProcesso,
            pontosExecucao: pontosExecucao,
            pergunta: autoavaliacaoDoc?.perguntaFeita || "Nenhuma pergunta registrada.",
            autoavaliacao: autoavaliacaoDoc?.respostaDissertativa || "Nenhuma resposta enviada.",
            hasResponded: hasResponded,
            youtubeLink: grupoDoAluno?.youtubeLink || "",
            idGrupo: grupoDoAluno?.id || "",
            notasVideo: grupoDoAluno?.notasVideo || [0, 0, 0, 0]
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

  // --- LÓGICA DE AVALIAÇÃO DO VÍDEO ---
  const handleNotaVideoChange = async (grupoId: string, indexCriterio: number, novaPorcentagem: number) => {
    if (!grupoId) return;

    // Atualiza a interface otimisticamente (para todo o grupo)
    let notasParaSalvar = [0, 0, 0, 0];
    setAlunos(prevAlunos => prevAlunos.map(aluno => {
      if (aluno.idGrupo === grupoId) {
        const novasNotas = [...(aluno.notasVideo || [0, 0, 0, 0])];
        novasNotas[indexCriterio] = novaPorcentagem;
        notasParaSalvar = [...novasNotas]; // Guarda para salvar no banco
        return { ...aluno, notasVideo: novasNotas };
      }
      return aluno;
    }));

    try {
      // Salva a nova configuração no Firestore do grupo
      const grupoRef = doc(db, 'grupos', grupoId);
      await updateDoc(grupoRef, {
        notasVideo: notasParaSalvar
      });
    } catch (err) {
      console.error("Erro ao salvar a nota do video: ", err);
      alert("Erro ao salvar a nota do vídeo. As alterações não foram persistidas.");
    }
  };

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

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Vídeo do Grupo:</p>
                  {aluno.youtubeLink ? (
                    <>
                      <a href={aluno.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline break-all flex items-center gap-1 mb-4">
                        ▶ Assistir no YouTube
                      </a>

                      {/* CALCULADORA DE RUBRICA */}
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-bold text-gray-700">Avaliação do Professor:</p>
                          <p className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                            {((aluno.notasVideo || [0, 0, 0, 0]).reduce((acc, val) => acc + (val / 100) * VALOR_POR_CRITERIO, 0)).toFixed(2)} / 2.50
                          </p>
                        </div>

                        <div className="space-y-3">
                          {RUBRICA_CRITERIOS.map((criterioNome, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">{criterioNome}</span>
                              <div className="flex gap-1">
                                {VALORES_PERCENTUAIS.map(pct => {
                                  const notas = aluno.notasVideo || [0, 0, 0, 0];
                                  // Se não tem nota lançada ainda no banco, o botão de 0% deve ficar ativo como default
                                  const isSelected = (aluno.notasVideo && notas[idx] === pct) || (!aluno.notasVideo && pct === 0);
                                  return (
                                    <button
                                      key={pct}
                                      onClick={() => handleNotaVideoChange(aluno.idGrupo || "", idx, pct)}
                                      className={`flex-1 text-[11px] py-1 px-1 rounded transition-colors border ${isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                      {pct}%
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-red-500 italic">Pendente</p>
                  )}
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