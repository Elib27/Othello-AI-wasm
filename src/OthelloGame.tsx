import type { Component } from 'solid-js';
import { createSignal, For} from 'solid-js';
import styles from './OthelloGame.module.css';
import { initializeGameBoard } from './othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal(initializeGameBoard());

  return (
    <table class={styles.gameboard}>
      <tbody>
        <For each={gameboard()}>{(row, i) => 
          <tr>
            <For each={row}>{(col, j) =>
              <td class={styles.border}>{col}</td>
            }</For>
          </tr>
        }</For>
      </tbody>
    </table>
  );
}

export default OthelloGame;