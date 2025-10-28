// Importa o SDK Admin do Firebase
const admin = require('firebase-admin');

// Importa a chave de serviço que você baixou
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o app do Firebase com as credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pega a referência do banco de dados Firestore
const db = admin.firestore();

// --- NOVOS DADOS PARA INSERIR ---

const alunosData = [
  { "matricula": "10720200083", "nome": "Beatriz Kliemann Amaral", "idGrupo": "grupo-1" },
  { "matricula": "10720120018", "nome": "Carolina Vieira Vidoto", "idGrupo": "grupo-1" },
  { "matricula": "10720240188", "nome": "Geovana Fortunato Rodrigues", "idGrupo": "grupo-1" },
  { "matricula": "10720240037", "nome": "Mariana Salmazo Carmello", "idGrupo": "grupo-1" },
  { "matricula": "10720150041", "nome": "Pietra Teixeira Monteiro", "idGrupo": "grupo-1" },
  { "matricula": "10720150018", "nome": "Ana Luiza Barbosa de Araujo", "idGrupo": "grupo-2" },
  { "matricula": "10720240208", "nome": "Lara Rangel Lopes", "idGrupo": "grupo-2" },
  { "matricula": "10720200193", "nome": "Lorena Luni Calvo", "idGrupo": "grupo-2" },
  { "matricula": "10720240092", "nome": "Pietra Grave Oliveira", "idGrupo": "grupo-2" },
  { "matricula": "10720150029", "nome": "Sofia Xavier Rosa", "idGrupo": "grupo-2" },
  { "matricula": "10720220150", "nome": "Ana Clara de Toledo Calil", "idGrupo": "grupo-3" },
  { "matricula": "10720110206", "nome": "Ana Sofia Susuki Schliemann", "idGrupo": "grupo-3" },
  { "matricula": "10720200093", "nome": "Julia Aranda Maltez", "idGrupo": "grupo-3" },
  { "matricula": "10720240052", "nome": "Natália Amaral de Medeiros", "idGrupo": "grupo-3" },
  { "matricula": "10720200219", "nome": "Rafael Ismael Drigo", "idGrupo": "grupo-3" },
  { "matricula": "10720230078", "nome": "Caio Cesar Lopes de Oliveira Gomes", "idGrupo": "grupo-4" },
  { "matricula": "10720190192", "nome": "Gustavo Gabriel Rodrigues de Araujo", "idGrupo": "grupo-4" },
  { "matricula": "10720130190", "nome": "João Pedro Zardo do Nascimento", "idGrupo": "grupo-4" },
  { "matricula": "10720240216", "nome": "Letícia Santos Carvalho", "idGrupo": "grupo-4" },
  { "matricula": "10720240182", "nome": "Luca Parisi Curci Fuim", "idGrupo": "grupo-4" },
  { "matricula": "10720120163", "nome": "Enzo Farina Cortez de Napoli", "idGrupo": "grupo-5" },
  { "matricula": "10720210073", "nome": "Lara Molinari Batista", "idGrupo": "grupo-5" },
  { "matricula": "10720240273", "nome": "Maria Eduarda Farnesi Cerqueira de Neiva", "idGrupo": "grupo-5" },
  { "matricula": "10720160111", "nome": "Mariana Venturini Souza", "idGrupo": "grupo-5" },
  { "matricula": "10720130245", "nome": "Victor Santana Haussmann Zago", "idGrupo": "grupo-5" },
  { "matricula": "10720220191", "nome": "Allan Kenzo Dotoli", "idGrupo": "grupo-6" },
  { "matricula": "10720150138", "nome": "Gabriel Ricarte Mendonça Evangelista", "idGrupo": "grupo-6" },
  { "matricula": "10720230047", "nome": "João Paulo Mileo Vicente", "idGrupo": "grupo-6" },
  { "matricula": "10720210224", "nome": "Mateus Galvez Moroz", "idGrupo": "grupo-6" },
  { "matricula": "10720150143", "nome": "Otávio Bonato Passerine", "idGrupo": "grupo-6" },
  { "matricula": "10720250144", "nome": "Gabriela Duarte de Albuquerque", "idGrupo": "grupo-7" },
  { "matricula": "10720240191", "nome": "Lorena Marinho Cocati", "idGrupo": "grupo-7" },
  { "matricula": "10720220160", "nome": "Lucas Fachini Bessa", "idGrupo": "grupo-7" },
  { "matricula": "10720140205", "nome": "Matteo Ferreira", "idGrupo": "grupo-7" },
  { "matricula": "10720240292", "nome": "Raphael Barranqueiro Pereira", "idGrupo": "grupo-7" }
];

const gruposData = [
  { "id": "grupo-1", "nomeGrupo": "Grupo 1", "membros": ["10720200083", "10720120018", "10720240188", "10720240037", "10720150041"] },
  { "id": "grupo-2", "nomeGrupo": "Grupo 2", "membros": ["10720150018", "10720240208", "10720200193", "10720240092", "10720150029"] },
  { "id": "grupo-3", "nomeGrupo": "Grupo 3", "membros": ["10720220150", "10720110206", "10720200093", "10720240052", "10720200219"] },
  { "id": "grupo-4", "nomeGrupo": "Grupo 4", "membros": ["10720230078", "10720190192", "10720130190", "10720240216", "10720240182"] },
  { "id": "grupo-5", "nomeGrupo": "Grupo 5", "membros": ["10720120163", "10720210073", "10720240273", "10720160111", "10720130245"] },
  { "id": "grupo-6", "nomeGrupo": "Grupo 6", "membros": ["10720220191", "10720150138", "10720230047", "10720210224", "10720150143"] },
  { "id": "grupo-7", "nomeGrupo": "Grupo 7", "membros": ["10720250144", "10720240191", "10720220160", "10720140205", "10720240292"] }
];

// --- FUNÇÃO PARA INSERIR OS DADOS ---

async function seedDatabase() {
  try {
    console.log('Iniciando o povoamento do banco de dados para o novo semestre...');

    // Inserindo alunos
    console.log('Inserindo novos alunos...');
    for (const aluno of alunosData) {
      await db.collection('alunos').add(aluno);
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

    console.log('Povoamento do banco de dados concluído!');
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  }
}

// Executa a função
seedDatabase();