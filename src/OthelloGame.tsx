import type { Component } from 'solid-js';
import { createSignal, Index, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import type { Move } from './othello';
import {
  initializeGameBoard,
  cloneGameboard,
  placeLegalMovesOnGameboard,
  isMoveValid,
  playMove,
  checkIfGameEnd
} from './othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal(initializeGameBoard());
  const [player, setPlayer] = createSignal('x');
  const [isGameEnd, setIsGameEnd] = createSignal(false);

  const gameboardWithPossibleMoves = () => placeLegalMovesOnGameboard(gameboard(), player());

  const changePlayer = () => setPlayer(p => p === 'x' ? 'o' : 'x');

  function setPlayerCase(move: Move) {
    if (!isMoveValid(move, player(), gameboard())) return;
    const newGameboard = cloneGameboard(gameboard());
    playMove(move, player(), newGameboard);
    setIsGameEnd(checkIfGameEnd(newGameboard));
    setGameboard(newGameboard);
    changePlayer();
  }

  return (
    <Show when={!isGameEnd()} fallback={<div>Game Ended</div>}>
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