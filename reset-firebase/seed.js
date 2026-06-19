const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Importa a chave de serviço que você baixou
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o app do Firebase com as credenciais
initializeApp({
  credential: cert(serviceAccount)
});

// Pega a referência do banco de dados Firestore
const db = getFirestore();

// --- NOVOS DADOS PARA INSERIR ---

const alunosData = [
  { "matricula": "10720220124", "nome": "Felipe Heinrich Spina Abib Matos", "idGrupo": "grupo-1" },
  { "matricula": "10720220100", "nome": "Guilherme Costa Carvalho Ray", "idGrupo": "grupo-1" },
  { "matricula": "10720200228", "nome": "Jose Afonso Pinto Neto", "idGrupo": "grupo-1" },
  { "matricula": "10720160201", "nome": "Nicholas Meneses Ferreira Rodrigues", "idGrupo": "grupo-1" },
  { "matricula": "10720160023", "nome": "Vitor Nakao Ishii", "idGrupo": "grupo-1" },
  { "matricula": "10720130022", "nome": "Arthur de Almeida Pegorelli", "idGrupo": "grupo-2" },
  { "matricula": "10720260101", "nome": "Bruno Baldi Sprano", "idGrupo": "grupo-2" },
  { "matricula": "10720260151", "nome": "Enzo Cirino Duarte", "idGrupo": "grupo-2" },
  { "matricula": "10720200149", "nome": "Nathalia Tampelli Guermandi", "idGrupo": "grupo-2" },
  { "matricula": "10720230045", "nome": "Vinicius Gonçalez de Almeida", "idGrupo": "grupo-2" },
  { "matricula": "10720190051", "nome": "Eduardo Bartolini Tambara", "idGrupo": "grupo-3" },
  { "matricula": "10720220174", "nome": "Enzo Inforsato Miranda", "idGrupo": "grupo-3" },
  { "matricula": "10720250055", "nome": "Felipe Caldo Sanchez", "idGrupo": "grupo-3" },
  { "matricula": "10720160005", "nome": "Rafael Frederico Laporta", "idGrupo": "grupo-3" },
  { "matricula": "10720250205", "nome": "Vívian Rodrigues Parreira", "idGrupo": "grupo-3" },
  { "matricula": "10720220139", "nome": "Ania Pikel Sviatopolk Mirsky", "idGrupo": "grupo-4" },
  { "matricula": "10720160004", "nome": "Arthur de Almeida Cinalli", "idGrupo": "grupo-4" },
  { "matricula": "10720160012", "nome": "Carolina Pinheiro Santaniello", "idGrupo": "grupo-4" },
  { "matricula": "10720170118", "nome": "Julia Pollini Gravina", "idGrupo": "grupo-4" },
  { "matricula": "10720160006", "nome": "Sofia Frederico Laporta", "idGrupo": "grupo-4" },
  { "matricula": "10720230186", "nome": "Ana Luiza Dal Ben Bento", "idGrupo": "grupo-5" },
  { "matricula": "10720160105", "nome": "Beatriz Dezoti da Fonseca", "idGrupo": "grupo-5" },
  { "matricula": "10720210078", "nome": "Daniele Oliveira Rodrigues", "idGrupo": "grupo-5" },
  { "matricula": "10720130238", "nome": "Maria Eduarda Modesto de Castro", "idGrupo": "grupo-5" },
  { "matricula": "10720250135", "nome": "Mariana Ramos de Araújo", "idGrupo": "grupo-5" },
  { "matricula": "10720120008", "nome": "Sophia de Paulo Aires de Lima", "idGrupo": "grupo-5" }
];

const gruposData = [
  { "id": "grupo-1", "nomeGrupo": "Grupo 1", "membros": ["10720220124", "10720220100", "10720200228", "10720160201", "10720160023"] },
  { "id": "grupo-2", "nomeGrupo": "Grupo 2", "membros": ["10720130022", "10720260101", "10720260151", "10720200149", "10720230045"] },
  { "id": "grupo-3", "nomeGrupo": "Grupo 3", "membros": ["10720190051", "10720220174", "10720250055", "10720160005", "10720250205"] },
  { "id": "grupo-4", "nomeGrupo": "Grupo 4", "membros": ["10720220139", "10720160004", "10720160012", "10720170118", "10720160006"] },
  { "id": "grupo-5", "nomeGrupo": "Grupo 5", "membros": ["10720230186", "10720160105", "10720210078", "10720130238", "10720250135", "10720120008"] }
];

// --- FUNÇÃO PARA INSERIR OS DADOS ---

async function seedDatabase() {
  try {
    console.log('Iniciando o povoamento do banco de dados para o novo semestre...');

    // LIMPEZA DA COLEÇÃO ALUNOS
    console.log('Limpando a coleção "alunos" antiga...');
    const alunosSnapshot = await db.collection('alunos').get();
    const batchAlunos = db.batch();
    alunosSnapshot.docs.forEach((doc) => {
      batchAlunos.delete(doc.ref);
    });
    await batchAlunos.commit();
    console.log('Coleção "alunos" limpa!');

    // LIMPEZA DA COLEÇÃO GRUPOS
    console.log('Limpando a coleção "grupos" antiga...');
    const gruposSnapshot = await db.collection('grupos').get();
    const batchGrupos = db.batch();
    gruposSnapshot.docs.forEach((doc) => {
      batchGrupos.delete(doc.ref);
    });
    await batchGrupos.commit();
    console.log('Coleção "grupos" limpa!');

    // LIMPEZA DA COLEÇÃO AVALIACOES
    console.log('Limpando a coleção "avaliacoes" antiga...');
    const avaliacoesSnapshot = await db.collection('avaliacoes').get();
    const batchAvaliacoes = db.batch();
    avaliacoesSnapshot.docs.forEach((doc) => {
      batchAvaliacoes.delete(doc.ref);
    });
    await batchAvaliacoes.commit();
    console.log('Coleção "avaliacoes" limpa!');

    // Inserindo alunos
    console.log('Inserindo novos alunos...');
    for (const aluno of alunosData) {
      // Usar a matrícula como ID do documento para evitar duplicidades
      await db.collection('alunos').doc(aluno.matricula).set(aluno);
    }
    console.log('Novos alunos inseridos com sucesso!');

    // Inserindo grupos
    console.log('Inserindo novos grupos...');
    for (const grupo of gruposData) {
      await db.collection('grupos').doc(grupo.id).set({
        nomeGrupo: grupo.nomeGrupo,
        membros: grupo.membros
      });
    }
    console.log('Novos grupos inseridos com sucesso!');

    console.log('Povoamento do banco de dados concluído com uma base limpa!');
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  }
}

// Executa a função
seedDatabase();