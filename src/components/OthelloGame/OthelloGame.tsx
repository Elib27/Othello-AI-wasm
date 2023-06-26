import type { Component } from 'solid-js';
import type { Move, Gameboard } from '../../othello';
import { createSignal, onMount, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import GameResult from '../GameResult/GameResult';
import GameboardUI from '../GameboardUI/GameboardUI';
import AIworker from '../../AIworker.js?worker'
import {
  AIplayer,
  initializeGameBoard,
  cloneGameboard,
  isMoveValid,
  playMove,
  checkIfGameEnd,
  getLegalMoves
} from '../../othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal<Gameboard>(initializeGameBoard());
  const [player, setPlayer] = createSignal('x');
  const [isGameEnd, setIsGameEnd] = createSignal(false);
  const [difficulty, setDifficulty] = createSignal(1);
  const [lastAIMove, setLastAIMove] = createSignal<Move | null>(null);

  const MIN_TIME_AI_TURN_MS = 1000;
  let startTimeAIturn = 0;

  const updateGameEnd = () => setIsGameEnd(checkIfGameEnd(gameboard()));

  const difficultyText = () => {
    switch (difficulty()) {
      case 0: return 'Easy';
      case 1: return 'Medium';
      case 2: return 'Hard';
      default: return 'Medium';
    }
  }

  function withDelay<T>(callback: () => T, delay: number) {
    const funcTimeOut = setTimeout(callback, delay);
    return funcTimeOut;
  }

  let getAImove: (gameboard: Gameboard, player: string, difficulty: number) => void;

  let timeOutAImoveID: number | undefined;

  onMount(() => {
    const othelloAIworker = new AIworker();
    getAImove = (gameboard: Gameboard, player: string, difficulty: number) => othelloAIworker.postMessage({ gameboard, player, difficulty });
    
    othelloAIworker.onmessage = async (event) => {
      const ellapsedTimeAIturn = Date.now() - startTimeAIturn;
      const timeToWait = MIN_TIME_AI_TURN_MS - ellapsedTimeAIturn;
      timeOutAImoveID = withDelay(() => playAImove(event.data.move), timeToWait);
    };
  });

  function playAImove(move: Move) {
    updateGameboardWithMove(move, player());
    setLastAIMove(move);
    setPlayer('x');
    updateGameEnd();
    const playerLegalMoves = getLegalMoves(player(), gameboard());
    if (playerLegalMoves.length === 0) requestAImove();
  }

  function reset() {
    if (player() === AIplayer) clearInterval(timeOutAImoveID);
    setGameboard(initializeGameBoard());
    setPlayer('x');
    setLastAIMove(null);
    setIsGameEnd(false);
  }

  function changeDifficulty() {
    reset();
    setDifficulty(d => (d + 1) % 3);
  }

  function updateGameboardWithMove(move: Move, player: string) {
    const newGameboard = cloneGameboard(gameboard());
    playMove(move, player, newGameboard);
    setGameboard(newGameboard);
  }

  function requestAImove() {
    const AIlegalMoves = getLegalMoves(AIplayer, gameboard());
    if (AIlegalMoves.length === 0) return;
    setPlayer('o');
    startTimeAIturn = Date.now();
    getAImove(gameboard(), AIplayer, difficulty());
  }

  function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (!isMoveValid(move, player(), gameboard())) return;
    updateGameboardWithMove(move, player());
    setLastAIMove(null);
    updateGameEnd();
    requestAImove();
  }


  return (
    <div class={styles.layout}>
      <div class={styles.sideWrapper}>
        <button
          classList={{[styles.resetButton]: true, [styles.resetButtonAccent]: isGameEnd()}}
          onClick={reset}
        >Reset</button>
      </div>
      <div class={styles.centerWrapper}>
        <Show when={isGameEnd()}>
          <GameResult gameboard={gameboard()}/>
        </Show>
        <div class={styles.playerRound}>{player() === AIplayer ? "AI is playing..." : "It's your turn !"}</div>
        <GameboardUI
          gameboard={gameboard}
          player={player}
          setPlayerCase={setPlayerCase}
          lastAIMove={lastAIMove}
        />
      </div>
      <div class={styles.sideWrapper}>
        <button
          class={styles.resetButton}
          onClick={changeDifficulty}
        >Difficulty: {difficultyText()}</button>
      </div>
    </div>
  );
}

export default OthelloGame;