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
  getLegalMoves,
  convertGameboardToArray,
  convertAImoveToMove,
  copyInt8Array
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

  let getAImoveWrapper: (gameboard: Gameboard, player: string, difficulty: number) => Promise<Move>;

  onMount(() => {
    WebAssembly.instantiateStreaming(fetch('/othelloAI.wasm'), {}).then(obj => {

      const getAImove = obj.instance.exports.getAImove as CallableFunction;

      getAImoveWrapper = async (gameboard: Gameboard, player: string, difficulty: number) => {
        const arrayGameboard = convertGameboardToArray(gameboard);
        const WASMmemory = obj.instance.exports.memory as WebAssembly.Memory;
        const arrayGameboardMemory = new Int8Array(WASMmemory.buffer);
        copyInt8Array(arrayGameboard, arrayGameboardMemory);
        const result = getAImove(arrayGameboardMemory, player.charCodeAt(0), difficulty);
        const move = convertAImoveToMove(result);
        return move;
      }
    });
  });

  function reset() {
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

  async function playAIMove() {
    setPlayer('o');
    await new Promise(resolve => setTimeout(resolve, 500));
    const AIlegalMoves = getLegalMoves(player(), gameboard());
    if (AIlegalMoves.length === 0) return;
    const move = await getAImoveWrapper(gameboard(), player(), difficulty())
    updateGameboardWithMove(move, player());
    setPlayer('x');
    updateGameEnd();
    const playerLegalMoves = getLegalMoves(player(), gameboard());
    if (playerLegalMoves.length === 0) playAIMove();
  }

  async function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (!isMoveValid(move, player(), gameboard())) return;
    updateGameboardWithMove(move, player());
    updateGameEnd();
    await playAIMove();
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