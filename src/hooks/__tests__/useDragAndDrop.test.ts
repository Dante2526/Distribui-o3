import { renderHook, act } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import { useDragAndDrop } from "../useDragAndDrop";

describe("useDragAndDrop", () => {
  test("initializes correctly and handles drag start", () => {
    const setActiveId = vi.fn();
    const setOverId = vi.fn();
    const setActiveSupportId = vi.fn();
    
    const { result } = renderHook(() => useDragAndDrop({
      isAdmin: false,
      activeIdRef: { current: null },
      setActiveId,
      setOverId,
      handleStartEditRef: { current: vi.fn() },
      handleStopEditRef: { current: vi.fn() },
      clonedDepartmentsRef: { current: null },
      clonedSupportRef: { current: null },
      clonedSpecialShiftRef: { current: null },
      departmentsDataRef: { current: [] },
      supportRolesDataRef: { current: [] },
      specialShiftDataRef: { current: [] },
      dragSourceRef: { current: null },
      setActiveSupportId,
      setDepartmentsData: vi.fn(),
      setSupportRolesData: vi.fn(),
      setSpecialShiftData: vi.fn(),
      selectedTurma: 'A',
    }));

    expect(result.current.sensors).toBeDefined();
    
    // Simulate drag start
    act(() => {
      result.current.handleDragStart({ active: { id: "emp-1" } } as any);
    });

    expect(setActiveId).toHaveBeenCalledWith("emp-1");
    expect(setOverId).toHaveBeenCalledWith(null);
  });
});
