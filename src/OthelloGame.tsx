import type { Component } from 'solid-js';
import type { Move, Gameboard } from './othello';
import { createSignal, createEffect, onMount, Index, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import GameResult from './GameResult';
import {
  initializeGameBoard,
  cloneGameboard,
  placeLegalMovesOnGameboard,
  isMoveValid,
  playMove,
  checkIfGameEnd,
  getLegalMoves
} from './othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal<Gameboard>(initializeGameBoard());
  const [player, setPlayer] = createSignal('x');
  const [isGameEnd, setIsGameEnd] = createSignal(false);

  const gameboardWithPossibleMoves = () => placeLegalMovesOnGameboard(gameboard(), player());

  const changePlayer = () => setPlayer(p => p === 'x' ? 'o' : 'x');

  const AIplayer = 'o';

  // onMount(() => {
  //   WebAssembly.instantiateStreaming(fetch('/othello.wasm'), {}).then(obj => {

  //     const arrayGameboardMemory = new Int8Array(obj.instance.exports.memory.buffer);
    
  //     for (let i = 0; i < arrayGameboard.length; i++) {
  //       arrayGameboardMemory[i] = arrayGameboard[i];
  //     }
    
  //     const { getAImove } = obj.instance.exports;
    
  //     const getAI = () => {
  //       const result = getAImove(arrayGameboardMemory, 'x'.charCodeAt(0));
  //       console.log(result);
  //       const move = convertAImoveToMove(result);
  //       console.log(move);
  //     };
  //   });
  // });

  createEffect(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (player() !== AIplayer) return;
    const legalMoves = getLegalMoves(AIplayer, gameboard());
    if (legalMoves.length > 0) {
      const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      setPlayerCase(move);
    }
    changePlayer();
  });

  createEffect(() => {
    const gameEndStatus = checkIfGameEnd(gameboard());
    setIsGameEnd(gameEndStatus);
  })

  function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (!isMoveValid(move, player(), gameboard())) return;
    const newGameboard = cloneGameboard(gameboard());
    playMove(move, player(), newGameboard);
    setGameboard(newGameboard);
    changePlayer();
  }

  return (
    <Show when={!isGameEnd()} fallback={<GameResult gameboard={gameboard()}/>}>
      <div class={styles.playerRound}>{player() === AIplayer ? "AI is playing..." : "It's your turn !"}</div>
      <table class={styles.gameboard}>
        <tbody>
          <Index each={gameboardWithPossibleMoves()}>{(row, i) => 
            <tr class={styles.row}>
              <Index each={row()}>{(gameCase, j) =>
                <td
                  class={styles.cell}
                  onClick={() => setPlayerCase({row: i, column: j})}
                >
                  <Show when={ gameCase() !== ' ' }>
                    <div classList={{
                      [styles.piece]: true, 
                      [styles.black]: gameCase() === 'x',
                      [styles.white]: gameCase() === 'o',
                      [styles.border]: gameCase() === '.'
                      }}
                    ></div>
                  </Show>
                </td>
              }</Index>
            </tr>
          }</Index>
        </tbody>
      </table>
    </Show>
  );
}

export default OthelloGame;