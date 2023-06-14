/*** Othello game logic ***/

export type Gameboard = string[][];

export type Move = {
  row: number;
  column: number;
};

const GAMEBOARD_SIZE = 8;

export function initializeGameBoard(): Gameboard {
  const gameboard = Array(GAMEBOARD_SIZE).fill(null).map(() => Array(GAMEBOARD_SIZE).fill(' '));
  gameboard[3][3] = 'o';
  gameboard[3][4] = 'x';
  gameboard[4][3] = 'x';
  gameboard[4][4] = 'o';
  return gameboard;
}

function printGameBoard(gameboard: Gameboard): void {
  console.log('  0  1  2  3  4  5  6  7');
  for (let i = 0; i < GAMEBOARD_SIZE; i++) {
    console.log(i + ' ' + gameboard[i].join('  '));
  }
}

export function cloneGameboard(gameboard: Gameboard): Gameboard {
  const gameboardClone = Array(GAMEBOARD_SIZE).fill(null).map(() => Array(GAMEBOARD_SIZE).fill(' '));
  for (let i = 0; i < GAMEBOARD_SIZE; i++) {
    for (let j = 0; j < GAMEBOARD_SIZE; j++) {
      gameboardClone[i][j] = gameboard[i][j]
    }
  }
  return gameboardClone
}

function changePlayer(player: string): string {
  return (player == 'x') ? 'o' : 'x';
}

function isCaseInGameboard(row: number, column: number): boolean {
  const isCaseInRow = (row >= 0) && (row <= 7);
  const isCaseInColumn = (column >= 0) && (column <= 7);
  return isCaseInRow && isCaseInColumn;
}

function isCaseInArray(move: Move, moves: Move[]): boolean {
  for (let i = 0; i < moves.length; i++)
    if (move.row === moves[i].row && move.column === moves[i].column)
      return true;
  return false;
}

function getAdversary(player: string): string {
  return (player == 'x') ? 'o' : 'x';
}

function getLegalMoves(player: string, gameboard: Gameboard): Move[] {
  const legalMoves: Move[] = [];
  const adversary = getAdversary(player);
  for (let row = 0; row < GAMEBOARD_SIZE; row++) {
    for (let column = 0; column < GAMEBOARD_SIZE; column++) {
      if (gameboard[row][column] === player) {
        const vectors = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [-1, 1], [1, -1], [1, 0], [1, 1]];
        for (let i = 0; i < vectors.length; i++) {
          let mult = 1;
          let newRow = row + vectors[i][0];
          let newColumn = column + vectors[i][1];
          if (!isCaseInGameboard(newRow, newColumn) || gameboard[newRow][newColumn] === ' ')
            continue;
          while (isCaseInGameboard(newRow, newColumn) && gameboard[newRow][newColumn] === adversary) {
            mult++;
            newRow = row + mult * vectors[i][0];
            newColumn = column + mult * vectors[i][1];
          }
          if (isCaseInGameboard(newRow, newColumn) && gameboard[newRow][newColumn] === ' ') {
            const legalMove = { row: newRow, column: newColumn };
            if (!isCaseInArray(legalMove, legalMoves)) {
              legalMoves.push(legalMove);
            }
          }
        }
      }
    }
  }
  return legalMoves;
}

function isLegalMove(move: Move, player: string, gameboard: Gameboard): boolean {
  const legalMoves: Move[] = getLegalMoves(player, gameboard);
  const isMoveLegal = isCaseInArray(move, legalMoves);
  return isMoveLegal;
}

export function isMoveValid(move: Move, player: string, gameboard: Gameboard): boolean {
  if (!isCaseInGameboard(move.row, move.column)) return false;
  if (gameboard[move.row][move.column] != ' ') return false;
  if (!isLegalMove(move, player, gameboard)) return false;
  return true;
}

function convertAdversaryPieces(move: Move, player: string, gameboard: Gameboard): void {
  const adversary = getAdversary(player);
  const vectors = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [-1, 1], [1, -1], [1, 0], [1, 1]];
  for (let i = 0; i < vectors.length; i++) {
    const casesToConvert: Move[] = [];
    let mult = 1;
    let newRow = move.row + vectors[i][0];
    let newColumn = move.column + vectors[i][1];
    while (isCaseInGameboard(newRow, newColumn) && gameboard[newRow][newColumn] === adversary) {
      casesToConvert.push({ row: newRow, column: newColumn });
      mult++;
      newRow = move.row + mult * vectors[i][0];
      newColumn = move.column + mult * vectors[i][1];
    }
    if (!isCaseInGameboard(newRow, newColumn) || gameboard[newRow][newColumn] !== player) {
      continue;
    }
    for (let j = 0; j < casesToConvert.length; j++) {
      const currRow = casesToConvert[j].row;
      const currColumn = casesToConvert[j].column;
      gameboard[currRow][currColumn] = player;
    }
  }
}

export function playMove(move: Move, player: string, gameboard: Gameboard): void {
  gameboard[move.row][move.column] = player;
  convertAdversaryPieces(move, player, gameboard);
}

export function placeLegalMovesOnGameboard(gameboard: Gameboard, player: string): Gameboard {
  const legalMoves = getLegalMoves(player, gameboard);
  const gameboardWithLegalMoves = cloneGameboard(gameboard);
  for (let i = 0; i < legalMoves.length; i++) {
    const row = legalMoves[i].row;
    const column = legalMoves[i].column;
    gameboardWithLegalMoves[row][column] = '.';
  }
  return gameboardWithLegalMoves;
}

function removeLegalMovesOnGameboard(gameboard: Gameboard): void {
  for (let i = 0; i < GAMEBOARD_SIZE; i++) {
    for (let j = 0; j < GAMEBOARD_SIZE; j++) {
      if (gameboard[i][j] == '.')
        gameboard[i][j] = ' ';
    }
  }
}

export function checkIfGameEnd(gameboard: Gameboard): boolean {
  const playerOLegalMoves = getLegalMoves('o', gameboard);
  const playerXLegalMoves = getLegalMoves('x', gameboard);
  const legalMovesCounterPlayerX = playerXLegalMoves.length;
  const legalMovesCounterPlayerO = playerOLegalMoves.length;
  const endGame = !legalMovesCounterPlayerX && !legalMovesCounterPlayerO;
  return endGame;
}

function countPlayerPieces(player: string, gameboard: Gameboard): number {
  let piecesCount = 0;
  for (let i = 0; i < GAMEBOARD_SIZE; i++) {
    for (let j = 0; j < GAMEBOARD_SIZE; j++) {
      if (gameboard[i][j] == player)
        piecesCount++;
    }
  }
  return piecesCount;
}

function countPieces(gameboard: Gameboard): number {
  const playerXPiecesCounter = countPlayerPieces('x', gameboard);
  const playerOPiecesCounter = countPlayerPieces('o', gameboard);
  const totalPiecesCount = playerXPiecesCounter + playerOPiecesCounter;
  return totalPiecesCount;
}

function printWinner(gameboard: Gameboard): void {
  const playerXPiecesCounter = countPlayerPieces('x', gameboard);
  const playerOPiecesCounter = countPlayerPieces('o', gameboard);
  if (playerXPiecesCounter > playerOPiecesCounter)
    console.log('Winner : X');
  else if (playerXPiecesCounter < playerOPiecesCounter)
    console.log('Winner : O');
  else
    console.log('Draw');
  console.log('\n');
  console.log('X score : ' + playerXPiecesCounter);
  console.log('O score : ' + playerOPiecesCounter);
}