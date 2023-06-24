import type { Component } from 'solid-js';
import type { Move, Gameboard } from '../../othello';
import { createSignal, onMount, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import GameResult from '../GameResult/GameResult';
import GameboardUI from '../GameboardUI/GameboardUI';
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

  const updateGameEnd = () => setIsGameEnd(checkIfGameEnd(gameboard()));

  const difficultyText = () => {
    switch (difficulty()) {
      case 0: return 'Easy';
      case 1: return 'Medium';
      case 2: return 'Hard';
      default: return 'Medium';
    }
  }

  let getAImove: (gameboard: Gameboard, player: string, difficulty: number) => void;

  function initialiseAIWorker() {
    const othelloAIworker = new Worker("/worker.js");

    othelloAIworker.onmessage = (event) => {
      const move = event.data;
      playAImove(move);
    };

    getAImove = (gameboard: Gameboard, player: string, difficulty: number) => othelloAIworker.postMessage({ gameboard, player, difficulty });
  }

  onMount(initialiseAIWorker);

  function playAImove(move: Move) {
    updateGameboardWithMove(move, player());
    setPlayer('x');
    updateGameEnd();
    const playerLegalMoves = getLegalMoves(player(), gameboard());
    if (playerLegalMoves.length === 0) requestAImove();
  }

  function reset() {
    // if (player() === AIplayer) terminateAIworker();
    // initialiseAIWorker();
    setGameboard(initializeGameBoard());
    setPlayer('x');
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

  async function requestAImove() {
    setPlayer('o');
    const AIlegalMoves = getLegalMoves(player(), gameboard());
    if (AIlegalMoves.length === 0) return;
    getAImove(gameboard(), player(), difficulty());
  }

  async function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (!isMoveValid(move, player(), gameboard())) return;
    updateGameboardWithMove(move, player());
    updateGameEnd();
    await requestAImove();
  }


  return (
    <Show when={!isGameEnd()} fallback={<GameResult gameboard={gameboard()} reset={reset}/>}>
      <div class={styles.layout}>
        <button
          class={styles.resetButton}
          onClick={reset}
        >Reset</button>
        <div>
          <div class={styles.playerRound}>{player() === AIplayer ? "AI is playing..." : "It's your turn !"}</div>
          <GameboardUI
            gameboard={gameboard}
            player={player}
            setPlayerCase={setPlayerCase}
          />
        </div>
        <button
          class={styles.resetButton}
          onClick={changeDifficulty}
        >Difficulty: {difficultyText()}</button>
      </div>
    </Show>
  );
}

export default OthelloGame;