const GAMEBOARD_SIZE = 8;

function copyArray(src, dest) {
  for (let i = 0; i < src.length; i++) {
    dest[i] = src[i];
  }
}

function convertAImoveToMove(AImove) {
  const row = Math.floor(AImove / GAMEBOARD_SIZE);
  const column = AImove % GAMEBOARD_SIZE;
  const move = { row, column };
  return move;
}

function convertGameboardToArray(gameboard) {
  const gameboardArray = new Int8Array(GAMEBOARD_SIZE * GAMEBOARD_SIZE);
  for (let i = 0; i < GAMEBOARD_SIZE; i++) {
    for (let j = 0; j < GAMEBOARD_SIZE; j++) {
      gameboardArray[i * GAMEBOARD_SIZE + j] = gameboard[i][j].charCodeAt(0);
    }
  }
  return gameboardArray;
}

WebAssembly.instantiateStreaming(fetch('/othelloAI.wasm'), {}).then(obj => {

  let AI_SEARCH_CANCELLED = 0;

  const { getAImove, SET_STOP_AI_SEARCH } = obj.instance.exports;

  function stopAISearch() {
    AI_SEARCH_CANCELLED = 1;
    SET_STOP_AI_SEARCH(1);
  }

  function activateAISearch() {
    AI_SEARCH_CANCELLED = 0;
    SET_STOP_AI_SEARCH(0);
  }

  async function generateAImove(gameboard, player, difficulty) {
    activateAISearch();
    const arrayGameboard = convertGameboardToArray(gameboard);
    const WASMmemory = obj.instance.exports.memory;
    const arrayGameboardMemory = new Int8Array(WASMmemory.buffer);
    copyArray(arrayGameboard, arrayGameboardMemory);
    const result = getAImove(arrayGameboardMemory, player.charCodeAt(0), difficulty);
    const move = convertAImoveToMove(result);
    return move;
  }

  self.onmessage = async (event) => {
    if (event.data?.cancelSearch) {
      stopAISearch();
      return;
    }
    const { gameboard, player, difficulty } = event.data;
    const AImove = await generateAImove(gameboard, player, difficulty);
    if (AI_SEARCH_CANCELLED) return;
    self.postMessage({ move: AImove });
  };
});