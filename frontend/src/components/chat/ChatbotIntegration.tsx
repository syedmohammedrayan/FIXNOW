'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import FloatingChatbot from './FloatingChatbot';

export default function ChatbotIntegration() {
  const [role, setRole] = useState<'customer' | 'technician'>('customer');
  const [userId, setUserId] = useState<string>('anonymous');
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const [hideForced, setHideForced] = useState(false);

  useEffect(() => {
    const checkForced = () => {
      setHideForced(document.body.classList.contains('hide-chatbot'));
    };
    checkForced();
    const observer = new MutationObserver(checkForced);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const shouldHide = hideForced;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Determine role by checking collections
        try {
          // Check technician first as it's more specific
          const techDoc = await getDoc(doc(db, 'technicians', user.uid));
          if (techDoc.exists()) {
            setRole('technician');
          } else {
            // Default or check customer
            setRole('customer');
          }
        } catch (error) {
          console.error("Error determining chatbot role:", error);
          setRole('customer');
        }
      } else {
        setUserId('anonymous');
        setRole('customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || shouldHide) return null;

  return <FloatingChatbot role={role} userId={userId} />;
}
