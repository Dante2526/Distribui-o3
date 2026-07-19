// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import { useDragAndDrop } from "../useDragAndDrop";

describe("useDragAndDrop", () => {
  test("initializes correctly and handles drag start", () => {
    const { result } = renderHook(() =>
      useDragAndDrop({
        isAdmin: false,
        handleStartEditRef: { current: vi.fn() },
        handleStopEditRef: { current: vi.fn() },
        logMovementRef: { current: vi.fn() },
        departmentsData: [],
        supportRolesData: [],
        specialShiftData: [],
        setDepartmentsData: vi.fn(),
        setSupportRolesData: vi.fn(),
        setSpecialShiftData: vi.fn(),
        selectedTurma: "A" as any,
      }),
    );

    expect(result.current.sensors).toBeDefined();

    act(() => {
      result.current.handleDragStart({
        active: { id: "1" as any, data: {} as any, rect: {} as any },
      });
    });

    // Check if internal states updated
    expect(result.current.activeId).toBe("1");
  });
});
