import { useEffect, Dispatch, SetStateAction } from 'react';
import { firestoreService } from '../services/firestoreService';
import { signInToFirebase } from '../lib/firebase';
import { TurmaType, ActiveEdit } from '../types';

interface UseFirebaseSyncProps {
  selectedTurma: TurmaType | null;
  isDemoMode: boolean;
  isTabVisible: boolean;
  setActiveEdits: Dispatch<SetStateAction<Record<string, ActiveEdit>>>;
}

export function useFirebaseSync({
  selectedTurma,
  isDemoMode,
  isTabVisible,
  setActiveEdits,
}: UseFirebaseSyncProps) {
  // Inicialização / Login Anônimo ao montar o app
  useEffect(() => {
    signInToFirebase();
  }, []);

  useEffect(() => {
    if (!selectedTurma || isDemoMode || !isTabVisible) return;

    // Escuta edições ativas em tempo real
    const unsubscribeEdits = firestoreService.subscribeToActiveEdits(
      selectedTurma,
      (edits) => {
        const now = Date.now();
        const cleanedEdits: Record<string, ActiveEdit> = {};
        
        Object.keys(edits).forEach((key) => {
          // Ignora edições mais antigas que 15s que ficaram presas
          if (now - edits[key].timestamp < 15000) {
            cleanedEdits[key] = edits[key];
          }
        });
        
        setActiveEdits(cleanedEdits);
      },
    );

    const cleanupInterval = setInterval(() => {
      setActiveEdits((prev) => {
        const now = Date.now();
        const cleaned: Record<string, ActiveEdit> = {};
        let changed = false;
        Object.keys(prev).forEach((key) => {
          if (now - prev[key].timestamp < 15000) {
            cleaned[key] = prev[key];
          } else {
            changed = true;
          }
        });
        return changed ? cleaned : prev;
      });
    }, 5000);

    return () => {
      unsubscribeEdits();
      clearInterval(cleanupInterval);
    };
  }, [selectedTurma, isDemoMode, isTabVisible, setActiveEdits]);
}
