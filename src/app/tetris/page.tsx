'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

type ShapeType = keyof typeof SHAPES;

interface Position {
  x: number;
  y: number;
}

export default function Tetris() {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    color: string;
    position: Position;
  } | null>(null);
  const [nextPiece, setNextPiece] = useState<{
    shape: number[][];
    color: string;
    position: Position;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<number | null>(null);

  const createPiece = useCallback((): {
    shape: number[][];
    color: string;
    position: Position;
  } => {
    const types = Object.keys(SHAPES) as ShapeType[];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: SHAPES[type],
      color: COLORS[type],
      position: { x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2), y: 0 },
    };
  }, []);

  const isValidMove = useCallback(
    (shape: number[][], position: Position): boolean => {
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const newX = position.x + x;
            const newY = position.y + y;
            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY >= 0 && board[newY][newX]) return false;
          }
        }
      }
      return true;
    },
    [board]
  );

  const rotatePiece = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        rotated[x][rows - 1 - y] = shape[y][x];
      }
    }
    return rotated;
  }, []);

  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    const newBoard = board.map((row) => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(COLS).fill(null));
        linesCleared++;
        y++;
      }
    }

    setScore((prev) => prev + linesCleared * 100);
    setBoard(newBoard);
    
    // Använd nästa bit och generera en ny för framtiden
    if (nextPiece) {
      setCurrentPiece(nextPiece);
      setNextPiece(createPiece());
    } else {
      // Fallback om nextPiece inte finns (bör inte hända)
      const newPiece = createPiece();
      setCurrentPiece(newPiece);
      setNextPiece(createPiece());
    }
  }, [board, currentPiece, createPiece, nextPiece]);

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 };
    if (isValidMove(currentPiece.shape, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
    } else {
      lockPiece();
    }
  }, [currentPiece, isValidMove, lockPiece, isPaused, gameOver]);

  const moveLeft = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { ...currentPiece.position, x: currentPiece.position.x - 1 };
    if (isValidMove(currentPiece.shape, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
    }
  }, [currentPiece, isValidMove, isPaused, gameOver]);

  const moveRight = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { ...currentPiece.position, x: currentPiece.position.x + 1 };
    if (isValidMove(currentPiece.shape, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
    }
  }, [currentPiece, isValidMove, isPaused, gameOver]);

  const rotate = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const rotated = rotatePiece(currentPiece.shape);
    if (isValidMove(rotated, currentPiece.position)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  }, [currentPiece, rotatePiece, isValidMove, isPaused, gameOver]);

  const drop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { ...currentPiece.position };
    while (isValidMove(currentPiece.shape, { ...newPosition, y: newPosition.y + 1 })) {
      newPosition.y++;
    }
    setCurrentPiece({ ...currentPiece, position: newPosition });
    setTimeout(() => lockPiece(), 50);
  }, [currentPiece, isValidMove, lockPiece, isPaused, gameOver]);

  const resetGame = useCallback(() => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPiece(createPiece());
    setNextPiece(createPiece());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  }, [createPiece]);

  useEffect(() => {
    if (!currentPiece) {
      setCurrentPiece(createPiece());
      setNextPiece(createPiece());
    }
  }, [currentPiece, createPiece]);

  useEffect(() => {
    if (currentPiece && !isValidMove(currentPiece.shape, currentPiece.position)) {
      setGameOver(true);
    }
  }, [currentPiece, isValidMove]);

  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      moveDown();
    }, 1000);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveDown, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          drop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, drop]);

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-4">Tetris</h1>
      
      <div className="flex gap-8 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white text-lg">Poäng: {score}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white text-sm mb-2">Nästa bit:</p>
            <div className="grid grid-cols-4 gap-1 w-24 h-24 bg-gray-900 p-2 rounded border border-gray-700">
              {nextPiece && nextPiece.shape.map((row, y) =>
                row.map((cell, x) => (
                   cell ? (
                    <div
                      key={`next-${y}-${x}`}
                      className="w-full h-full"
                      style={{
                        gridColumn: x + 1,
                        gridRow: y + 1,
                        backgroundColor: nextPiece.color,
                        boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.3)'
                      }}
                    />
                  ) : null
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white text-sm mb-2">Kontroller:</p>
            <p className="text-gray-300 text-xs">← → : Flytta</p>
            <p className="text-gray-300 text-xs">↑ : Rotera</p>
            <p className="text-gray-300 text-xs">↓ : Snabbare ner</p>
            <p className="text-gray-300 text-xs">Space : Droppa</p>
            <p className="text-gray-300 text-xs">P : Paus</p>
          </div>

          <button
            onClick={resetGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Nytt spel
          </button>
        </div>

        <div
          className="bg-gray-800 border-4 border-gray-700 relative"
          style={{
            width: COLS * CELL_SIZE,
            height: ROWS * CELL_SIZE,
          }}
        >
          {renderBoard().map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="absolute border border-gray-700"
                style={{
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: cell || 'transparent',
                  boxShadow: cell ? 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              />
            ))
          )}
        </div>
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-white text-xl mb-4">Poäng: {score}</p>
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Spela igen
            </button>
          </div>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Paus</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Fortsätt
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4 md:hidden">
        <button
          onTouchStart={(e) => { e.preventDefault(); moveLeft(); }}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-2xl"
        >
          ←
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); rotate(); }}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-2xl"
        >
          ↻
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); drop(); }}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-2xl"
        >
          ↓
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); moveRight(); }}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-2xl"
        >
          →
        </button>
      </div>
    </div>
  );
}
