import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFirebaseSync } from '../useFirebaseSync';
import { firestoreService } from '../../services/firestoreService';

// Mock do firestoreService
vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    subscribeToActiveEdits: vi.fn(),
  }
}));

describe('useFirebaseSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve fazer subscribe se isDemoMode for true', () => {
    renderHook(() => useFirebaseSync({ 
      selectedTurma: 'A' as any, 
      isDemoMode: true, 
      isTabVisible: true,
      setActiveEdits: vi.fn()
    }));

    expect(firestoreService.subscribeToActiveEdits).not.toHaveBeenCalled();
  });

  it('deve fazer subscribe e limpar activeEdits expirados (>15s)', () => {
    const mockUnsubscribe = vi.fn();
    (firestoreService.subscribeToActiveEdits as any).mockReturnValue(mockUnsubscribe);

    const setActiveEditsMock = vi.fn();

    renderHook(() => useFirebaseSync({ 
      selectedTurma: 'A' as any, 
      isDemoMode: false, 
      isTabVisible: true,
      setActiveEdits: setActiveEditsMock
    }));

    expect(firestoreService.subscribeToActiveEdits).toHaveBeenCalledWith(
      'A',
      expect.any(Function)
    );

    // Simulando chamada de retorno do Firebase
    const callback = (firestoreService.subscribeToActiveEdits as any).mock.calls[0][1];
    
    const now = Date.now();
    const editsFromFirebase = {
      'user1': { timestamp: now - 5000 }, // Válido (5s atrás)
      'user2': { timestamp: now - 20000 } // Expirado (20s atrás)
    };

    callback(editsFromFirebase);

    expect(setActiveEditsMock).toHaveBeenCalledWith({
      'user1': { timestamp: now - 5000 }
    });
  });

  it('deve chamar unsubscribe quando o componente desmontar', () => {
    const mockUnsubscribe = vi.fn();
    (firestoreService.subscribeToActiveEdits as any).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useFirebaseSync({ 
      selectedTurma: 'A' as any, 
      isDemoMode: false, 
      isTabVisible: true,
      setActiveEdits: vi.fn()
    }));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
