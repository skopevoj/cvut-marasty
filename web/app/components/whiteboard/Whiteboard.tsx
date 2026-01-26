"use client";

import {
  useWhiteboardStore,
  useQuizStore,
  useSettingsStore,
} from "../../lib/stores";
import { usePeer } from "../../lib/providers";
import { useEffect, useRef, useState, useCallback } from "react";

// Get the question card element as the reference for positioning
function getReferenceElement(): HTMLElement | null {
  return document.querySelector("main.glass-card-themed") as HTMLElement;
}

export function Whiteboard() {
  const settings = useSettingsStore();
  const currentQuestionIndex = useQuizStore((s) => s.currentIndex);
  const whiteboard = useWhiteboardStore();
  const { isConnected, broadcastMessage } = usePeer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const lastX = useRef(0);
  const lastY = useRef(0);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !settings.whiteboardEnabled) return;

    const resize = () => {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Save current content
      const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Restore content
      ctx.putImageData(temp, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [settings.whiteboardEnabled]); // Re-run when enabled

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([data]);
      setRedoStack([]);

      // Broadcast clear to peers
      if (isConnected) {
        broadcastMessage({
          type: "whiteboard-clear",
          data: {},
        });
      }
    }
  }, [isConnected, broadcastMessage]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const updated = [...prev, data];
        if (updated.length > 30) updated.shift();
        return updated;
      });
      setRedoStack([]);
    }
  }, []);

  const undo = useCallback(() => {
    if (history.length <= 1) {
      if (history.length === 1) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (canvas && ctx) {
          const current = history[0];
          setRedoStack((prev) => [current, ...prev]);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHistory([]);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const current = history[history.length - 1];
      const previous = history[history.length - 2];

      setRedoStack((prev) => [current, ...prev]);
      setHistory((prev) => prev.slice(0, -1));
      ctx.putImageData(previous, 0, 0);
    }
  }, [history]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const next = redoStack[0];
      setRedoStack((prev) => prev.slice(1));
      setHistory((prev) => [...prev, next]);
      ctx.putImageData(next, 0, 0);
    }
  }, [redoStack]);

  useEffect(() => {
    whiteboard.setClearFn(() => clear);
    whiteboard.setUndoFn(() => undo);
    whiteboard.setRedoFn(() => redo);
  }, [clear, undo, redo]);

  // Handle peer whiteboard drawing - always register handlers regardless of whiteboard state
  // This ensures drawings from peers are received even if local whiteboard is disabled
  // Track last positions for each peer to draw connected strokes
  const peerLastPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  useEffect(() => {
    const handleWhiteboardDraw = (message: any) => {
      const { data, senderId } = message;

      // Handle stroke end - reset position tracking for this peer
      if (data.strokeEnd) {
        peerLastPositions.current.delete(senderId);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn("[Whiteboard] Canvas not available");
        return;
      }

      // Ensure canvas is sized properly
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("[Whiteboard] Context not available");
        return;
      }

      // Get the local reference element to convert coordinates
      const refElement = getReferenceElement();
      let x0, y0, x1, y1;

      if (refElement && data.hasRef !== false) {
        const rect = refElement.getBoundingClientRect();
        // Convert from reference-relative percentages to screen pixels
        x0 = rect.left + data.x0 * rect.width;
        y0 = rect.top + data.y0 * rect.height;
        x1 = rect.left + data.x1 * rect.width;
        y1 = rect.top + data.y1 * rect.height;
      } else {
        // Fallback to viewport-based
        x0 = data.x0 * canvas.width;
        y0 = data.y0 * canvas.height;
        x1 = data.x1 * canvas.width;
        y1 = data.y1 * canvas.height;
      }

      ctx.strokeStyle = data.color;
      ctx.fillStyle = data.color;
      ctx.lineWidth = data.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Get last known position for this peer
      const lastPos = peerLastPositions.current.get(senderId);

      // Draw a circle at the start point to ensure smooth connection
      ctx.beginPath();
      ctx.arc(x0, y0, data.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw the line segment
      ctx.beginPath();
      if (
        lastPos &&
        Math.abs(lastPos.x - x0) < 50 &&
        Math.abs(lastPos.y - y0) < 50
      ) {
        // If close to last position, draw from last position for smoother connection
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(x0, y0);
        ctx.stroke();
        ctx.beginPath();
      }
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Draw a circle at the end point
      ctx.beginPath();
      ctx.arc(x1, y1, data.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();

      // Store the end position for this peer
      peerLastPositions.current.set(senderId, { x: x1, y: y1 });
    };

    const handleWhiteboardClear = () => {
      console.log("[Whiteboard] Received whiteboard-clear message");
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Clear peer positions on clear
      peerLastPositions.current.clear();
    };

    // Always register handlers - they use refs so they'll work when canvas is available
    const registerHandlers = () => {
      if ((window as any).__registerPeerMessageHandler) {
        console.log("[Whiteboard] Registering peer message handlers");
        (window as any).__registerPeerMessageHandler(
          "whiteboard-draw",
          handleWhiteboardDraw,
        );
        (window as any).__registerPeerMessageHandler(
          "whiteboard-clear",
          handleWhiteboardClear,
        );
        return true;
      }
      return false;
    };

    // Try to register immediately, and retry if not available yet
    if (!registerHandlers()) {
      const interval = setInterval(() => {
        if (registerHandlers()) {
          clearInterval(interval);
        }
      }, 100);

      // Clean up interval after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
    }

    return () => {
      if ((window as any).__unregisterPeerMessageHandler) {
        console.log("[Whiteboard] Unregistering peer message handlers");
        (window as any).__unregisterPeerMessageHandler("whiteboard-draw");
        (window as any).__unregisterPeerMessageHandler("whiteboard-clear");
      }
    };
  }, []); // No dependencies - register once on mount

  // Clear drawing on question change
  useEffect(() => {
    if (settings.whiteboardEnabled) {
      clear();
    }
  }, [currentQuestionIndex, clear, settings.whiteboardEnabled]);

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return { x: clientX, y: clientY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!settings.whiteboardEnabled || isMobile) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastX.current = x;
    lastY.current = y;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !settings.whiteboardEnabled || isMobile) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.strokeStyle =
      whiteboard.tool === "eraser" ? "#030303" : whiteboard.color;
    ctx.lineWidth = whiteboard.tool === "eraser" ? 40 : 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Save old values before updating
    const oldX = lastX.current;
    const oldY = lastY.current;

    const midX = (lastX.current + x) / 2;
    const midY = (lastY.current + y) / 2;

    ctx.quadraticCurveTo(lastX.current, lastY.current, midX, midY);
    ctx.stroke();

    // Start a new path from the midpoint to keep it smooth
    ctx.beginPath();
    ctx.moveTo(midX, midY);

    // Update last position
    lastX.current = x;
    lastY.current = y;

    // Broadcast drawing to peers using the old values
    if (isConnected) {
      const refElement = getReferenceElement();
      let normalizedData;

      if (refElement) {
        const rect = refElement.getBoundingClientRect();

        // Calculate positions relative to the reference element
        normalizedData = {
          x0: (oldX - rect.left) / rect.width,
          y0: (oldY - rect.top) / rect.height,
          x1: (midX - rect.left) / rect.width,
          y1: (midY - rect.top) / rect.height,
          color: whiteboard.tool === "eraser" ? "#030303" : whiteboard.color,
          lineWidth: whiteboard.tool === "eraser" ? 40 : 2.5,
          hasRef: true,
        };
      } else {
        // Fallback to viewport-based if no reference element
        const canvas = canvasRef.current;
        if (canvas) {
          normalizedData = {
            x0: oldX / window.innerWidth,
            y0: oldY / window.innerHeight,
            x1: midX / window.innerWidth,
            y1: midY / window.innerHeight,
            color: whiteboard.tool === "eraser" ? "#030303" : whiteboard.color,
            lineWidth: whiteboard.tool === "eraser" ? 40 : 2.5,
            hasRef: false,
          };
        }
      }

      if (normalizedData) {
        broadcastMessage({
          type: "whiteboard-draw",
          data: normalizedData,
        });
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();

      // Notify peers that stroke ended so they reset position tracking
      if (isConnected) {
        broadcastMessage({
          type: "whiteboard-draw",
          data: {
            strokeEnd: true,
          },
        });
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 transition-opacity duration-300 ${!settings.whiteboardEnabled || isMobile ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        zIndex: 10,
        backgroundColor: "transparent",
        cursor: whiteboard.tool === "eraser" ? "cell" : "crosshair",
        pointerEvents:
          settings.whiteboardEnabled && !isMobile ? "auto" : "none",
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
}
