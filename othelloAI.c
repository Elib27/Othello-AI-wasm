#include <emscripten.h>

#define EXTERN

#define GAMEBOARD_SIZE 8
#define MAX_POSSIBLE_CASES_TO_CONVERT 48
#define INFINITY 9999

#define MAX(x, y) (((x) > (y)) ? (x) : (y))

typedef struct
{
  int row;
  int column;
} Move;

int isCaseInArray(Move* move, Move moves[], int movesSize)
{
  for (int i = 0; i < movesSize; i++)
  {
    int rowsAreEqual = (move->row == moves[i].row);
    int columnsAreEqual = (move->column == moves[i].column);
    if (rowsAreEqual && columnsAreEqual) return 1;
  }
  return 0;
}

int countPlayerPieces(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  int playerPiecesCount = 0;
  for (int i = 0; i < 8; i++)
    for (int j = 0; j < 8; j++)
      if (gameboard[i][j] == player) playerPiecesCount++;
  return playerPiecesCount;
}

int countPiecesOnBoard(char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  int piecesOnBoard = 0;
  for (int i = 0; i < GAMEBOARD_SIZE; i++)
    for (int j = 0; j < GAMEBOARD_SIZE; j++)
      if (gameboard[i][j] != ' ') piecesOnBoard++;
  return piecesOnBoard;
}

void cloneGameboard(char source[GAMEBOARD_SIZE][GAMEBOARD_SIZE], char destination[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  for (int i = 0; i < GAMEBOARD_SIZE; i++)
    for (int j = 0; j < GAMEBOARD_SIZE; j++)
      destination[i][j] = source[i][j];
}

int isCaseInGameboard(int row, int column)
{
  int isCaseInLine = (column >= 0) && (column <= 7);
  int isCaseInColumn = (row >= 0) && (row <= 7);
  return isCaseInLine && isCaseInColumn;
}

int getLegalMoves(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE], Move legalMoves[])
{
  int legalMovesCounter = 0;
  char adversary = player == 'x' ? 'o' : 'x';
  for (int row = 0; row < 8; row++)
  {
    for (int column = 0; column < 8; column++)
    {
      if (gameboard[row][column] == player)
      {
        for (int i = -1; i <= 1; i++)
        {
          for (int j = -1; j <= 1; j++)
          {
            if ((i == 0) && (j == 0)) continue;
            int mult = 1;
            int newRow = row + i;
            int newColumn = column + j;
            if (gameboard[newRow][newColumn] == ' ') continue;
            while (isCaseInGameboard(newRow, newColumn) && gameboard[newRow][newColumn] == adversary)
            {
              mult++;
              newRow = row + mult * i;
              newColumn = column + mult * j;
            }
            if (isCaseInGameboard(newRow, newColumn) && gameboard[newRow][newColumn] == ' ')
            {
              Move possibleMove = { newRow, newColumn };
              if (!isCaseInArray(&possibleMove, legalMoves, legalMovesCounter))
              {
                legalMoves[legalMovesCounter] = possibleMove;
                legalMovesCounter++;
              }
            }
          }
        }
      }
    }
  }
  return legalMovesCounter;
}

int isMoveValid(int row, int column, char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  Move desiredMove = { row, column };
  Move legalMoves[60];
  int legalMovesCounter = getLegalMoves(player, gameboard, legalMoves);
  if (isCaseInArray(&desiredMove, legalMoves, legalMovesCounter)) return 1;
  return 0;
}

int isCaseValid(int row, int column, char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE], char* errorMessage)
{
  return gameboard[row][column] == ' ' && isCaseInGameboard(row, column) && isMoveValid(row, column, player, gameboard);
}

void convertAdversaryPieces(Move* move, char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  char adversary = (player == 'x') ? 'o' : 'x';
  Move casesToConvert[MAX_POSSIBLE_CASES_TO_CONVERT];
  for (int i = -1; i <= 1; i++)
  {
    for (int j = -1; j <= 1; j++)
    {
      if (i == 0 && j == 0) continue;
      int casesToConvertCount = 0;
      int mult = 1;
      int newRow = move->row + i;
      int newCol = move->column + j;
      while (isCaseInGameboard(newRow, newCol) && gameboard[newRow][newCol] == adversary)
      {
        casesToConvert[casesToConvertCount].row = newRow;
        casesToConvert[casesToConvertCount].column = newCol;
        mult++;
        casesToConvertCount++;
        newRow = move->row + i * mult;
        newCol = move->column + j * mult;
      }
      if (!isCaseInGameboard(newRow, newCol) || gameboard[newRow][newCol] == ' ')
      {
        casesToConvertCount -= (mult - 1);
      }
      for (int k = 0; k < casesToConvertCount; k++)
      {
        int currRow = casesToConvert[k].row;
        int currCol = casesToConvert[k].column;
        gameboard[currRow][currCol] = player;
      }
    }
  }
}

void playMove(Move* move, char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  gameboard[move->row][move->column] = player;
  convertAdversaryPieces(move, player, gameboard);
}

int playerCanPlay(int legalMovesCounter)
{
  return legalMovesCounter > 0;
}

int isGameEnd(char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  Move legalMoves[60];
  int possibleMovesCounterPlayerX = getLegalMoves('x', gameboard, legalMoves);
  int possibleMovesCounterPlayerO = getLegalMoves('o', gameboard, legalMoves);
  int isGameEnd = !possibleMovesCounterPlayerX && !possibleMovesCounterPlayerO;
  return isGameEnd;
}

#define MOBILITY_WEIGHT 3
#define PARITY_WEIGHT 3
#define STABILITY_WEIGHT 8

#define CORNER_WEIGHT 25
#define BORDER_WEIGHT 6
#define CENTER_WEIGHT 5
#define NULL___WEIGHT 0
#define MALUS1_WEIGHT -2
#define MALUS2_WEIGHT -10

int getPositionScore(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  char adversary = player == 'x' ? 'o' : 'x';
  int positionScore = 0;

  char gameboardWeights[GAMEBOARD_SIZE][GAMEBOARD_SIZE] = {
      {CORNER_WEIGHT, MALUS2_WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, MALUS2_WEIGHT, CORNER_WEIGHT},
      {MALUS2_WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, MALUS2_WEIGHT, MALUS2_WEIGHT},
      {NULL___WEIGHT, NULL___WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, NULL___WEIGHT, NULL___WEIGHT},
      {NULL___WEIGHT, NULL___WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, NULL___WEIGHT, NULL___WEIGHT},
      {NULL___WEIGHT, NULL___WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, NULL___WEIGHT, NULL___WEIGHT},
      {NULL___WEIGHT, NULL___WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, CENTER_WEIGHT, NULL___WEIGHT, NULL___WEIGHT},
      {MALUS2_WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, MALUS2_WEIGHT, MALUS2_WEIGHT},
      {CORNER_WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, NULL___WEIGHT, MALUS2_WEIGHT, CORNER_WEIGHT},
  };

  for (int i = 0; i < GAMEBOARD_SIZE; i++)
  {
    for (int j = 0; j < GAMEBOARD_SIZE; j++)
    {
      if (gameboard[i][j] == player)
        positionScore += gameboardWeights[i][j];
      else if (gameboard[i][j] == adversary)
        positionScore -= gameboardWeights[i][j];
    }
  }

  return positionScore;
}

int countSideStablePieces(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  int stableSidePiecesCount = 0;
  int corners[4][2] = { {0, 0}, {0, GAMEBOARD_SIZE - 1}, {GAMEBOARD_SIZE - 1, GAMEBOARD_SIZE - 1}, {GAMEBOARD_SIZE - 1, 0} };
  int directions[8][2] = { {1, 0}, {0, 1}, {-1, 0}, {0, 1}, {-1, 0}, {0, -1}, {-1, 0}, {0, 1} };
  for (int k = 0; k < 4; k++)
  {
    if (gameboard[corners[k][0]][corners[k][1]] != player) continue;
    for (int i = 0; i < GAMEBOARD_SIZE; i++)
    {
      int row = corners[k][0] + i * directions[k][0];
      int column = corners[k][1] + i * directions[k][1];
      if (!isCaseInGameboard(row, column)) break;
      if (gameboard[row][column] != player) break;
      stableSidePiecesCount++;
    }
  }
  return stableSidePiecesCount;
}

int getParityCount(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  char adversary = player == 'x' ? 'o' : 'x';
  int playerPiecesCount = countPlayerPieces(player, gameboard);
  int adversaryPiecesCount = countPlayerPieces(adversary, gameboard);
  int parityCount = playerPiecesCount - adversaryPiecesCount;
  return parityCount;
}

#define END_GAME_PIECES 12

int heuristic(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE], int originalPiecesOnBoard)
{
  int score = 0;
  if (originalPiecesOnBoard < (64 - END_GAME_PIECES))
  {
    int positionScore = getPositionScore(player, gameboard);
    score += positionScore;

    int stableSidePiecesCounter = countSideStablePieces(player, gameboard);
    score += stableSidePiecesCounter * STABILITY_WEIGHT;
  }
  int parityCount = getParityCount(player, gameboard);
  score += parityCount * PARITY_WEIGHT;
  return score;
}

int getNegamaxDepth(int piecesOnBoard, int difficulty)
{
  int depth = 8;
  int startDepths[3] = { 2, 5, 10 };
  int middleDepths[3] = { 2, 4, 8 };
  int endDepths[3] = { 2, 4, END_GAME_PIECES };

  if (piecesOnBoard < 10)
    depth = startDepths[difficulty];
  else if (piecesOnBoard < 64 - END_GAME_PIECES)
    depth = middleDepths[difficulty];
  else
    depth = endDepths[difficulty];
  return depth;
}

int negamax(int depth, char player, char originalPlayer, int maximizingPlayer, int alpha, int beta, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE], int originalPiecesOnBoard)
{
  if (depth == 0 || isGameEnd(gameboard))
  {
    return maximizingPlayer * heuristic(originalPlayer, gameboard, originalPiecesOnBoard);
  }
  char adversary = player == 'x' ? 'o' : 'x';
  int heuristicValue = -INFINITY;
  Move legalMoves[60];
  int legalMovesCounter = getLegalMoves(player, gameboard, legalMoves);
  int i = 0;
  do
  {
    char gameboardClone[GAMEBOARD_SIZE][GAMEBOARD_SIZE];
    cloneGameboard(gameboard, gameboardClone);
    if (playerCanPlay(legalMovesCounter)) playMove(&legalMoves[i], player, gameboardClone);
    int eval = negamax(depth - 1, adversary, originalPlayer, -maximizingPlayer, -beta, -alpha, gameboardClone, originalPiecesOnBoard);
    heuristicValue = MAX(heuristicValue, -eval);
    alpha = MAX(alpha, heuristicValue);
    if (alpha >= beta) break;
    i++;
  } while (i < legalMovesCounter);
  return heuristicValue;
}

void findBestMove(char player, char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE], Move* bestMove, int difficulty)
{
  Move legalMoves[60];
  char adversary = player == 'x' ? 'o' : 'x';
  int bestScore = -INFINITY;
  int legalMovesCounter = getLegalMoves(player, gameboard, legalMoves);
  int piecesOnBoard = countPiecesOnBoard(gameboard);
  int depth = getNegamaxDepth(piecesOnBoard, difficulty);
  for (int i = 0; i < legalMovesCounter; i++)
  {
    char gameboardClone[GAMEBOARD_SIZE][GAMEBOARD_SIZE];
    cloneGameboard(gameboard, gameboardClone);
    playMove(&legalMoves[i], player, gameboardClone);
    int moveScore = -negamax(depth - 1, adversary, player, -1, -INFINITY, INFINITY, gameboardClone, piecesOnBoard);
    if (moveScore > bestScore)
    {
      bestMove->row = legalMoves[i].row;
      bestMove->column = legalMoves[i].column;
      bestScore = moveScore;
    }
  }
}

void convertArrayToGameboard(char gameboardArray[GAMEBOARD_SIZE * GAMEBOARD_SIZE], char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE])
{
  for (int i = 0; i < GAMEBOARD_SIZE; i++)
    for (int j = 0; j < GAMEBOARD_SIZE; j++)
      gameboard[i][j] = gameboardArray[i * GAMEBOARD_SIZE + j];
}

EXTERN EMSCRIPTEN_KEEPALIVE int getAImove(char gameboardArray[GAMEBOARD_SIZE * GAMEBOARD_SIZE], char player, int difficulty)
{
  char gameboard[GAMEBOARD_SIZE][GAMEBOARD_SIZE];
  convertArrayToGameboard(gameboardArray, gameboard);
  Move bestMove;
  findBestMove(player, gameboard, &bestMove, difficulty);
  int bestMoveCase = bestMove.row * GAMEBOARD_SIZE + bestMove.column;
  return bestMoveCase;
}