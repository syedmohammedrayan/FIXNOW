const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    let finalVector = embedding;
    if (finalVector.length > 768) finalVector = finalVector.slice(0, 768);
    
    console.log("Embedding Length:", finalVector.length);
    return finalVector;
  } catch (err) {
    console.error('Embedding error:', err);
    throw err;
  }
}

async function upsertTechnicianVector(tech) {
  try {
    const embedding = await getEmbedding(`${tech.category} professional expert`);
    const indexName = process.env.PINECONE_INDEX.trim();
    const index = pc.index(indexName);

    // [DEFINITIVE v7.2.0 SYNTAX] 
    const payload = {
      records: [
        {
          id: String(tech.id),
          values: embedding,
          metadata: {
            name: String(tech.name || ""),
            category: String(tech.category || ""),
            online: Boolean(tech.online !== false),
            rating: Number(tech.rating || 5.0)
          }
        }
      ]
    };

    await index.upsert(payload);
    
    console.log(`[SUCCESS] Technician vector stored: ${tech.name}`);
    return true;
  } catch (err) {
    console.error('[ERROR] Pinecone SDK:', err.message);
    return false;
  }
}

async function searchRelevantTechnicians(issueText, limit = 5) {
  try {
    const embedding = await getEmbedding(issueText);
    const indexName = process.env.PINECONE_INDEX.trim();
    const index = pc.index(indexName);

    // Searching also uses the new query format
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: { online: { '$eq': true } }
    });

    return queryResponse.matches.map(match => ({
      id: match.id,
      score: match.score,
      ...match.metadata
    }));
  } catch (err) {
    console.error('[ERROR] Semantic Search:', err.message);
    return [];
  }
}

module.exports = {
  getEmbedding,
  upsertTechnicianVector,
  searchRelevantTechnicians
};
