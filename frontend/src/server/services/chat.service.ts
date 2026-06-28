/**
 * Chat Storage Service
 * =====================
 * Handles persistence of chat sessions to Firestore.
 * 
 * Data Model:
 * users/{userId}/chats/{sessionId}
 *   - messages: Array of chat messages
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *   - title: Optional chat title
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { Message } from 'ai';

/**
 * Save or update a chat session in Firestore.
 */
export async function saveChatSession(
  userId: string,
  sessionId: string,
  messages: Message[],
  title?: string
) {
  if (!userId || !sessionId) return;

  const chatRef = doc(db, 'users', userId, 'chats', sessionId);
  
  try {
    const docSnap = await getDoc(chatRef);
    
    if (docSnap.exists()) {
      await updateDoc(chatRef, {
        messages,
        updatedAt: Timestamp.now(),
      });
    } else {
      await setDoc(chatRef, {
        messages,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        title: title || 'New Conversation',
        sessionId,
      });
    }
  } catch (error) {
    console.error('[ChatService] Error saving chat session:', error);
  }
}

/**
 * Load a specific chat session's history.
 */
export async function getChatHistory(
  userId: string,
  sessionId: string
): Promise<Message[]> {
  if (!userId || !sessionId) return [];

  const chatRef = doc(db, 'users', userId, 'chats', sessionId);
  
  try {
    const docSnap = await getDoc(chatRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.messages || []) as Message[];
    }
  } catch (error) {
    console.error('[ChatService] Error loading chat session:', error);
  }
  
  return [];
}

/**
 * Get all chat sessions for a user (useful for a history sidebar).
 */
export async function getUserChatSessions(userId: string) {
  if (!userId) return [];

  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[ChatService] Error fetching user chats:', error);
    return [];
  }
}
