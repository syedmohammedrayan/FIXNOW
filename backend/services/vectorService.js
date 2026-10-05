// Pinecone is a vector database — stores embeddings so we can do semantic (meaning-based) search.
const { Pinecone } = require('@pinecone-database/pinecone');
// Gemini generates text embeddings — converts text into numeric vectors capturing semantic meaning.
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialise the Pinecone client with the project API key.
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Converts a text string into a numeric vector using Gemini's embedding model.
 * Embeddings capture semantic meaning so "broken pipe" and "water leaking" map to similar vectors.
 */
async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    // Pinecone index is configured at 768 dimensions; truncate if the model returns more.
    let finalVector = embedding;
    if (finalVector.length > 768) finalVector = finalVector.slice(0, 768);
    
    console.log("Embedding Length:", finalVector.length);
    return finalVector;
  } catch (err) {
    console.error('Embedding error:', err);
    throw err;
  }
}

/**
 * Stores (or updates) a technician's vector in Pinecone so they can be found by semantic search.
 * The embedding is generated from the technician's service category description.
 */
async function upsertTechnicianVector(tech) {
  try {
    // Embed a descriptive phrase about the technician's specialty for better semantic matching.
    const embedding = await getEmbedding(`${tech.category} professional expert`);
    const indexName = process.env.PINECONE_INDEX.trim();
    const index = pc.index(indexName);

    // Pinecone v7.2.0 upsert format: records array with id, values (vector), and metadata.
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

/**
 * Finds technicians whose category embedding is semantically close to the issue description.
 * Returns only online technicians, ranked by cosine similarity (score).
 */
async function searchRelevantTechnicians(issueText, limit = 5) {
  try {
    // Convert the customer's issue description into a vector for comparison.
    const embedding = await getEmbedding(issueText);
    const indexName = process.env.PINECONE_INDEX.trim();
    const index = pc.index(indexName);

    // topK limits results; filter ensures we only surface currently online technicians.
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: { online: { '$eq': true } }
    });

    // Flatten Pinecone's match objects into plain objects the rest of the app can consume.
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
