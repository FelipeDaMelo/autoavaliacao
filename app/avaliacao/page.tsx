"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';

import StarRating from '../components/StarRating';
import { FaRegThumbsUp, FaHourglassHalf } from 'react-icons/fa';

// --- DEFINIÇÕES E CONSTANTES ---
type Colega = { matricula: string; nome: string };
const CRITERIOS_PROCESSO = { comunicacao: "Comunicação", comprometimento: "Comprometimento", trabalhoEquipe: "Trabalho em Equipe / Colaboração" };
const CRITERIOS_EXECUCAO = { qualidade: "Qualidade da Entrega", proatividade: "Proatividade", presenca: "Presença e Engajamento" };
const PROATIVIDADE_DESC = "Capacidade de tomar a iniciativa, identificar problemas e sugerir soluções sem que alguém precise pedir.";
type NotasPorCriterio = { [criterio: string]: number };
type Avaliacoes = { [matricula: string]: NotasPorCriterio };

// --- COMPONENTE ---
export default function AvaliacaoPage() {
  const router = useRouter();

  // --- ESTADOS ---
  const [alunoNome, setAlunoNome] = useState('');
  const [alunoMatricula, setAlunoMatricula] = useState('');
  const [colegas, setColegas] = useState<Colega[]>([]);
  const [loadingState, setLoadingState] = useState<'checking' | 'loading' | 'done'>('checking');
  const [error, setError] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacoes>({});
  const [respostaDissertativa, setRespostaDissertativa] = useState('');
  const [perguntaSorteada, setPerguntaSorteada] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- LÓGICA DE BUSCA E VERIFICAÇÃO ---
  useEffect(() => {
    const matricula = sessionStorage.getItem('alunoMatricula');
    const nome = sessionStorage.getItem('alunoNome');
    const grupoId = sessionStorage.getItem('alunoGrupoId');

    if (!matricula || !nome || !grupoId) {
      router.push('/');
      return;
    }

    setAlunoNome(nome);
    setAlunoMatricula(matricula);

    const checkAndFetchData = async () => {
      try {
        const avaliacoesRef = collection(db, "avaliacoes");
        const q = query(avaliacoesRef, where("avaliadorMatricula", "==", matricula), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setHasResponded(true);
          setLoadingState('done');
          return;
        }

        setLoadingState('loading');
        
        const initialRatings: Avaliacoes = {};
        const todosCriterios = { ...CRITERIOS_PROCESSO, ...CRITERIOS_EXECUCAO };
        const notaInicial = Object.keys(todosCriterios).reduce((acc, crit) => ({ ...acc, [crit]: 0 }), {});
        initialRatings[matricula] = { ...notaInicial };

        const grupoRef = doc(db, 'grupos', grupoId);
        const grupoSnap = await getDoc(grupoRef);
        if (!grupoSnap.exists()) throw new Error("Grupo não encontrado.");
        
        const membrosMatriculas: string[] = grupoSnap.data().membros || [];
        const colegasMatriculas = membrosMatriculas.filter(m => m !== matricula);
        if (colegasMatriculas.length > 0) {
          const alunosRef = collection(db, 'alunos');
          const qColegas = query(alunosRef, where('matricula', 'in', colegasMatriculas));
          const colegasSnapshot = await getDocs(qColegas);
          const colegasData = colegasSnapshot.docs.map(doc => ({ matricula: doc.data().matricula, nome: doc.data().nome }));
          setColegas(colegasData);
          colegasData.forEach(colega => {
            initialRatings[colega.matricula] = { ...notaInicial };
          });
        }
        setAvaliacoes(initialRatings);

        const configRef = doc(db, 'configuracoes', 'perguntasAutoavaliacao');
        const configSnap = await getDoc(configRef);
        const listaPerguntas: string[] = configSnap.exists() ? (configSnap.data().perguntas || []) : [];
        if (listaPerguntas.length > 0) {
          setPerguntaSorteada(listaPerguntas[Math.floor(Math.random() * listaPerguntas.length)]);
        } else {
          setPerguntaSorteada("Descreva sua principal contribuição para o projeto.");
        }

        setLoadingState('done');

      } catch (err) {
        console.error("Erro ao verificar/buscar dados:", err);
        setError("Não foi possível carregar a página. Tente recarregar.");
        setLoadingState('done');
      }
    };

    checkAndFetchData();
  }, [router]);

  // --- LÓGICA DE ENVIO ---
  const handleRatingChange = (matricula: string, criterio: string, novaNota: number) => {
    setAvaliacoes(prev => ({ ...prev, [matricula]: { ...prev[matricula], [criterio]: novaNota } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!respostaDissertativa.trim()) {
      setError("A resposta da autoavaliação não pode estar em branco. Por favor, preencha o campo.");
      document.getElementById('dissertativa')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      for (const matriculaAvaliada of Object.keys(avaliacoes)) {
        await addDoc(collection(db, "avaliacoes"), {
          avaliadorMatricula: alunoMatricula,
          avaliadoMatricula: matriculaAvaliada,
          notas: avaliacoes[matriculaAvaliada],
          ...(matriculaAvaliada === alunoMatricula && {
            respostaDissertativa: respostaDissertativa,
            perguntaFeita: perguntaSorteada,
          }),
          timestamp: new Date()
        });
      }
      router.push('/sucesso');
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      setError("Ocorreu um erro ao enviar sua avaliação. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL ---
  if (loadingState === 'checking' || loadingState === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-center p-4">
        <FaHourglassHalf className="text-4xl text-gray-400 animate-spin mb-4" />
        <p className="text-lg text-gray-600">
          {loadingState === 'checking' ? 'Verificando seu status...' : 'Carregando formulário...'}
        </p>
      </main>
    );
  }
  
  // REMOVIDO: Bloco `if (error)` que estava aqui foi removido.
  
  if (hasResponded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 text-center p-4">
        <div className="w-full max-w-lg p-10 bg-white rounded-2xl shadow-xl space-y-6">
          <FaRegThumbsUp className="text-7xl text-blue-500 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-800">Tudo certo por aqui!</h1>
          <p className="text-lg text-gray-600">
            Olá, <span className="font-semibold">{alunoNome}</span>. Nosso sistema indica que você já enviou sua avaliação.
          </p>
          <p className="text-md text-gray-500">
            Obrigado pela sua participação!
          </p>
          <Link href="/" className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700">
            Voltar para a página inicial
          </Link>
        </div>
      </main>
    );
  }

  // --- RENDERIZAÇÃO DO FORMULÁRIO ---
  const CriteriosSection = ({ title, criterios, matricula }: { title: string, criterios: { [key: string]: string }, matricula: string }) => (
    <div>
      <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-4">{title}</h4>
      <div className="space-y-5">
        {Object.entries(criterios).map(([chave, valor]) => (
          <div key={chave}>
            <label className="block text-sm font-medium text-gray-800">{valor}</label>
            {chave === 'proatividade' && <p className="text-xs text-gray-500 italic mt-1">{PROATIVIDADE_DESC}</p>}
            <div className="mt-1">
              <StarRating count={5} rating={avaliacoes[matricula]?.[chave] || 0} onRatingChange={(novaNota) => handleRatingChange(matricula, chave, novaNota)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Página de Avaliação</h1>
            <p className="mt-1 text-md text-gray-600">Olá, <span className="font-semibold text-indigo-600">{alunoNome}</span>!</p>
        </div>
      </header>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* AVALIAÇÃO DOS COLEGAS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Avalie seus colegas</h2>
            {colegas.length > 0 ? (
              <div className="mt-6 space-y-8">
                {colegas.map((colega) => (
                  <div key={colega.matricula} className="p-6 bg-white rounded-xl shadow-md border transition-all hover:shadow-lg">
                    <h3 className="text-xl font-bold text-indigo-700">{colega.nome}</h3>
                    <CriteriosSection title="Habilidades de Processo" criterios={CRITERIOS_PROCESSO} matricula={colega.matricula} />
                    <CriteriosSection title="Habilidades de Execução" criterios={CRITERIOS_EXECUCAO} matricula={colega.matricula} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-gray-600">Você não tem colegas neste grupo para avaliar.</p>
            )}
          </section>
          {/* AUTOAVALIAÇÃO */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Autoavaliação</h2>
            <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-indigo-800">Avalie seu próprio desempenho</h3>
              <CriteriosSection title="Habilidades de Processo" criterios={CRITERIOS_PROCESSO} matricula={alunoMatricula} />
              <CriteriosSection title="Habilidades de Execução" criterios={CRITERIOS_EXECUCAO} matricula={alunoMatricula} />
              <div className="mt-8 pt-6 border-t border-indigo-200">
                <label htmlFor="dissertativa" className="block text-gray-800 font-semibold">
                  {perguntaSorteada || "Carregando pergunta..."}
                </label>
                <textarea
                  id="dissertativa"
                  rows={5}
                  className="mt-2 block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Seja detalhista em sua resposta..."
                  value={respostaDissertativa}
                  onChange={(e) => setRespostaDissertativa(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>
       
          <div className="py-4">
            {/* Bloco de erro posicionado corretamente */}
            {error && (
              <div className="mb-4 text-center p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                <p>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar e Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}